const chromium = require('chrome-aws-lambda');
const puppeteer = process.env.AWS
  ? require('puppeteer-core')
  : require('puppeteer');

module.exports = {
  connect: options => puppeteer.connect(options),
  launch: async ({ headless }) =>
    await puppeteer.launch(
      process.env.AWS
        ? {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless,
          }
        : {
            args: [
              '--disable-extensions',
              '--disable-infobars',
              '--disable-notifications',
              '--disable-offer-store-unmasked-wallet-cards',
              '--disable-offer-upload-credit-cards',
              '--enable-async-dns',
              '--enable-simple-cache-backend',
              '--enable-tcp-fast-open',
              '--password-store=basic',
              '--disable-translate',
              '--disable-cloud-import',
              '--no-first-run',
              '--start-maximized',
            ],
            headless,
            defaultViewport: null,
          }
    ),
};
