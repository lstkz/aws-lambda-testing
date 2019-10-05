const fs = require('fs');
const path = require('path');
const { launch, connect } = require('./puppeteer');

const socketPath = path.join('/tmp', 'browserWSEndpoint');

async function createNewInstance(jestConfig) {
  const browser = await launch({
    headless: !(jestConfig.watch || jestConfig.watchAll),
  });

  fs.writeFileSync(path.join('/tmp', 'pid'), browser.process().pid);
  fs.writeFileSync(
    path.join('/tmp', 'browserWSEndpoint'),
    browser.wsEndpoint()
  );
}

module.exports = async function setup(jestConfig) {
  if (fs.existsSync(socketPath)) {
    const socket = fs.readFileSync(socketPath, 'utf8');
    try {
      await connect({
        browserWSEndpoint: socket,
      });
    } catch (e) {
      await createNewInstance(jestConfig);
    }
  } else {
    await createNewInstance(jestConfig);
  }
};
