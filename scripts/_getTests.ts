import { execSync } from 'child_process';

const noop = () => {};

let names = [];
const currentPrefix = [];

// @ts-ignore
global.test = (name, fn) => {
  names.push([...currentPrefix, name].join(' '));
};

// @ts-ignore
global.describe = (name, fn) => {
  currentPrefix.push(name);
  fn();
  currentPrefix.pop();
};

// @ts-ignore
global.before = noop;
// @ts-ignore
global.beforeEach = noop;
// @ts-ignore
global.afterEach = noop;
// @ts-ignore
global.after = noop;

export function getTests() {
  const fileNames = execSync('find src -name *.test.*')
    .toString('utf8')
    .split('\n')
    .map(x => x.trim())
    .filter(x => x);

  return fileNames.map(fileName => {
    require('../' + fileName);
    const testCases = names;
    names = [];
    return {
      fileName,
      testCases,
    };
  });
}
