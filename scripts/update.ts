import AWS from 'aws-sdk';
import AdmZip from 'adm-zip';
import path from 'path';

process.env.AWS_SDK_LOAD_CONFIG = '1';

const cf = new AWS.CloudFormation();
const lambda = new AWS.Lambda();

(async () => {
  const resources = await cf
    .describeStackResources({
      StackName: 'lambda-testing',
    })
    .promise();
  const testLambda = resources.StackResources.find(
    res =>
      res.LogicalResourceId.startsWith('test') &&
      res.ResourceType === 'AWS::Lambda::Function'
  );
  if (!testLambda) {
    throw new Error('Cannot find test lambda');
  }

  const zip = new AdmZip();
  zip.addLocalFolder(path.join(__dirname, '../src'), 'src');
  zip.addLocalFile(path.join(__dirname, '../package.json'));

  await lambda
    .updateFunctionCode({
      FunctionName: testLambda.PhysicalResourceId,
      ZipFile: zip.toBuffer(),
    })
    .promise();
})();
