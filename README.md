# aws-lambda-testing
This is a proof of concept of running unlimited parallel E2E tests on AWS Lambda.  
A test framework is based on `jest` and `puppeteer`.

## Requirements
- node v10 https://nodejs.org/en/
- yarn `npm i -g yarn`
- aws cli https://aws.amazon.com/cli/
- cdk:
  - `npm i -g aws-cdk`
  - `cdk bootstrap`


## Deploy
Mac/Linux only.  
```bash
# install node_modules
yarn

# create a lambda layer with embedded node_modules
yarn create-layer

# create AWS stack, it takes 1-2 min
cdk deploy

# update lambda code, this is much faster than using cloudformation
# run this command every time you update tests
yarn run update

# run tests
yarn run invoke

# or run only 15 tests
yarn run invoke 15
```

## Sample test
There is a single test with the following steps:
- open https://google.com
- wait for the main input
- wait extra 2s - 5s
- randomly fail with 10% chance


## Benchmark

Benchmark without cold start. With cold start, it takes 2-4s more.

| N   | Time | Cost    |
| --- | ---- | ------- |
| 1   | 6s   | < $0.01 |
| 10  | 6.7s | < $0.01 |
| 50  | 6.8s | $0.02   |
| 100 | 7s   | $0.03   |
| 200 | 7s   | $0.08   |
| 500 | 7.4s | $0.15   |
| 800 | 7.5s | $0.22   |

To test higher N, you need to contact AWS support to increase the lambda execution limit.


## TODO
- Need user-friendly development mode used in localhost.
- Need better assertion library because puppeteer has low level API.
- Creating page screenshots on failed test.

## Need Help?
If you need help in creating fast E2E tests for your project, contact me at lukasz@sentkiewicz.pl.


## License
MIT
