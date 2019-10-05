const NodeEnvironment = require('jest-environment-node');
const { connect } = require('./puppeteer');
const path = require('path');
const fs = require('fs');

const socketPath = path.join('/tmp', 'browserWSEndpoint');

var browser;

class CustomEnvironment extends NodeEnvironment {
  async setup() {
    await super.setup();
    const socket = fs.readFileSync(socketPath, 'utf8');
    browser = await connect({
      browserWSEndpoint: socket,
      defaultViewport: null,
    });
    const oldPages = await browser.pages();
    this.global.page = await browser.newPage();
    for (const page of oldPages) {
      await page.close();
    }
    this.global.browser = browser;
  }
}

module.exports = CustomEnvironment;
