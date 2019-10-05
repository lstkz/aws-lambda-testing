const spawn = require('child_process').spawn;

function getData(event) {
  const data = event.Records ? JSON.parse(event.Records[0].body) : event;
  if (event.Records) {
    return JSON.parse(event.Records[0].body);
  }
  return {
    args: data.args || [],
  };
}

function getCost(time) {
  const memorySize = Number(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE);
  const timeSeconds = time / 1000;
  const memoryGB = memorySize / 1024;
  const costGB_Second = 0.00001667;
  return costGB_Second * timeSeconds * memoryGB;
}

exports.handler = async (event, context) => {
  const start = Date.now();
  const { args } = getData(event);
  const prefix = `${Date.now()}_`;
  const resultPath = `/tmp/${prefix}result.json`;
  var child = spawn(
    '/opt/nodejs/node_modules/.bin/jest',
    ['-i', '--json', '--outputFile=' + resultPath, ...args],
    {
      FILE_PREFIX: prefix,
    }
  );

  let out = '';
  //spit stdout to screen
  child.stdout.on('data', function(data) {
    console.log(data.toString('utf8'));
    out += data;
  });

  //spit stderr to screen
  child.stderr.on('data', function(data) {
    console.log(data.toString('utf8'));
    out += data;
  });
  return await new Promise(resolve => {
    child.on('close', async function(code) {
      console.log('Finished with code ' + code);
      const result = require(resultPath);
      result.testResults.forEach(testResult => {
        testResult.assertionResults = testResult.assertionResults.filter(
          assertion => assertion.status !== 'pending'
        );
      });
      const end = Date.now();
      resolve({
        cost: getCost(end - start),
        result: result.testResults,
      });
    });
  });
};
