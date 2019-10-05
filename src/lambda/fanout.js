const AWS = require('aws-sdk');

var lambda = new AWS.Lambda();

const MAX_TASKS = 10;

function split(arr, parts) {
  const size = Math.ceil(arr.length / parts);
  const tmp = [...arr];
  const ret = [];
  for (let i = 0; i < parts; i++) {
    ret.push(tmp.splice(0, size));
  }
  return ret;
}

async function run(tasks, functionName) {
  if (tasks.length <= MAX_TASKS) {
    const ret = [];
    await Promise.all(
      tasks.map(async task => {
        const lambdaResult = await lambda
          .invoke({
            FunctionName: functionName,
            Payload: JSON.stringify(task),
          })
          .promise();
        if (lambdaResult.StatusCode === 200) {
          const { result, cost } = JSON.parse(lambdaResult.Payload);
          ret.push({
            success: true,
            cost,
            result,
          });
        } else {
          ret.push({
            success: false,
            cost: 0,
            error: lambdaResult.Payload,
          });
        }
      })
    );
    return ret;
  } else {
    const ret = [];
    await Promise.all(
      split(tasks, MAX_TASKS).map(async part => {
        const lambdaResult = await lambda
          .invoke({
            FunctionName:
              process.env.AWS_LAMBDA_FUNCTION_NAME +
              ':' +
              process.env.AWS_LAMBDA_FUNCTION_VERSION,
            Payload: JSON.stringify({
              functionName,
              tasks: part,
            }),
          })
          .promise();
        if (lambdaResult.StatusCode === 200) {
          try {
            ret.push(...JSON.parse(lambdaResult.Payload));
          } catch (e) {
            ret.push({
              success: false,
              cost: 0,
              error: lambdaResult.Payload,
            });
          }
        } else {
          ret.push({
            success: false,
            cost: 0,
            error: lambdaResult.Payload,
          });
        }
      })
    );
    return ret;
  }
}

function getCost(time) {
  const memorySize = Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE);
  const timeSeconds = time / 1000;
  const memoryGB = memorySize / 1024;
  const costGB_Second = 0.00001667;
  return costGB_Second * timeSeconds * memoryGB;
}

exports.handler = async (event, context) => {
  const { tasks, functionName } = event;
  const start = Date.now();
  const ret = await run(tasks, functionName);
  const end = Date.now();
  return [
    {
      wrapper: true,
      cost: getCost(end - start),
    },
    ...ret,
  ];
};
