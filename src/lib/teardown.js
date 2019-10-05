const fs = require('fs');
const path = require('path');

module.exports = async function setup(jestConfig) {
  if (!(jestConfig.watch || jestConfig.watchAll)) {
    const pid = fs.readFileSync(path.join('/tmp', 'pid'), 'utf8');
    process.kill(Number(pid));
  }
};
