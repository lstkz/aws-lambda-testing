async function runTest() {
  await page.goto('https://google.com');

  await page.waitForSelector('input[type="text"]');

  // wait extra 2 - 5s
  const timeout = Math.round(Math.random() * 3 + 2);
  await new Promise(resolve => setTimeout(resolve, timeout * 1000));

  // random fail
  expect(Math.round(Math.random() * 10)).not.toBe(1);
}

function generateTests(n) {
  for (let i = 1; i <= n; i++) {
    test(`generated ${i}`, runTest);
  }
}

module.exports = {
  runTest,
  generateTests,
};
