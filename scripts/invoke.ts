import AWS from 'aws-sdk';
import chalk from 'chalk';
import fs from 'fs';
import { getTests } from './_getTests';

process.env.AWS_SDK_LOAD_CONFIG = '1';

const cf = new AWS.CloudFormation();
const lambda = new AWS.Lambda();

const commandArgs: string[][] = [];

interface Stats {
  [x: string]: {
    total: number;
    passed: number;
    failed: number;
  };
}

const N = Number(process.argv[2]) || 10000;

(async () => {
  const resources = await cf
    .describeStackResources({
      StackName: 'lambda-testing',
    })
    .promise();

  const fanoutLambda = resources.StackResources.find(
    res =>
      res.LogicalResourceId.startsWith('fanout') &&
      res.ResourceType === 'AWS::Lambda::Function'
  );
  if (!fanoutLambda) {
    throw new Error('Cannot find fanout lambda');
  }
  const testLambda = resources.StackResources.find(
    res =>
      res.LogicalResourceId.startsWith('test') &&
      res.ResourceType === 'AWS::Lambda::Function'
  );
  if (!testLambda) {
    throw new Error('Cannot find test lambda');
  }

  const tests = getTests();

  tests.forEach(test => {
    test.testCases.forEach(testCase => {
      commandArgs.push([
        '-t',
        `^${testCase}$`,
        '--testPathPattern',
        `${test.fileName}$`,
      ]);
    });
  });

  console.time('start');
  const ret = await lambda
    .invoke({
      FunctionName: fanoutLambda.PhysicalResourceId + ':$LATEST',
      Payload: JSON.stringify({
        functionName: testLambda.PhysicalResourceId + ':$LATEST',
        tasks: commandArgs.map(args => ({ args })).slice(0, N),
      }),
    })
    .promise();
  fs.writeFileSync('./out.json', JSON.stringify(ret));
  console.timeEnd('start');
  if (ret.FunctionError) {
    console.log(ret.FunctionError);
    console.log(ret.Payload);
    process.exit(1);
  }
  const stats: Stats = {};
  const data = JSON.parse(ret.Payload as string);
  let testCost = 0;
  let wrapperCost = 0;
  data.forEach(item => {
    if (item.wrapper) {
      wrapperCost += item.cost;
      return;
    }
    if (!item.success) {
      console.log(item.error);
      return;
    }
    if (!item.result) {
      return;
    }
    if (!Array.isArray(item.result)) {
      console.log(item.result);
      return;
    }
    testCost += item.cost;
    item.result.forEach(testResult => {
      const name = /\/(src\/.+)/.exec(testResult.name)[1];
      testResult.assertionResults.forEach(assertion => {
        if (assertion.status !== 'pending') {
          if (!stats[name]) {
            stats[name] = {
              failed: 0,
              passed: 0,
              total: 0,
            };
          }
          const testStats = stats[name];
          testStats.total++;
          if (assertion.status === 'passed') {
            testStats.passed++;
          } else if (assertion.status === 'failed') {
            // console.error(testResult.message);
            testStats.failed++;
          } else {
            console.log('unknown status', assertion.status);
          }
        }
      });
    });
  });
  console.log(`cost wrapper: $${wrapperCost}`);
  console.log(`cost test: $${testCost}`);
  console.log(`cost total: $${testCost + wrapperCost}`);
  Object.keys(stats).forEach(fileName => {
    const data = stats[fileName];
    console.log(chalk.white(fileName));
    console.log(`Total: ${data.total}`);
    console.log(chalk.green(`Passed: ${data.passed}`));
    console.log(chalk.red(`Failed: ${data.failed}`));
  });
})();
