const lambda = require('@aws-cdk/aws-lambda');
const cdk = require('@aws-cdk/core');
const { PolicyStatement, Effect } = require('@aws-cdk/aws-iam');
const Path = require('path');

class MainStack extends cdk.Stack {
  // @ts-ignore
  constructor(app, id) {
    super(app, id);

    const layer = new lambda.LayerVersion(this, 'testing-libs', {
      code: lambda.Code.fromAsset(Path.join(__dirname, '../layers/layer.zip')),
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_10_X,
        lambda.Runtime.NODEJS_8_10,
      ],
    });

    const fanout = new lambda.Function(this, `fanout`, {
      code: new lambda.AssetCode('src/lambda'),
      runtime: lambda.Runtime.NODEJS_8_10,
      handler: 'fanout.handler',
      timeout: cdk.Duration.minutes(10),
      memorySize: 3008,
    });

    const test = new lambda.Function(this, `test`, {
      code: new lambda.InlineCode('//placeholder'),
      runtime: lambda.Runtime.NODEJS_8_10,
      handler: 'src/lambda/test.handler',
      timeout: cdk.Duration.minutes(10),
      layers: [layer],
      memorySize: 3008,
      environment: {
        AWS: '1',
      },
    });

    fanout.addToRolePolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunction'],
        resources: ['*'],
        effect: Effect.ALLOW,
      })
    );

    // test.grantInvoke(fanout);
  }
}

const app = new cdk.App();
new MainStack(app, 'lambda-testing');
