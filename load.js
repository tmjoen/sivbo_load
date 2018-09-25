const { Cluster } = require('puppeteer-cluster');
const START_USER = 0;
const END_USER = 10;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    monitor: true,
    workerCreationDelay: 200,
    timeout: 120000
  });

  cluster.on('taskerror', (err, data) => {
    console.log(`Error crawling ${data}: ${err.message}`);
  });

  await cluster.task(async ({ page, data: userId }) => {
    await page.setViewport({ width: 1600, height: 1100 });
    await page.goto('http://192.168.1.15:8888/logg-inn');
    await page.type('.email-field', 'user-' + userId + '@example.com');
    await page.type('.password-field', 'admin');
    await page.click('.login-button');
    await page.waitFor('#profile-dropdown-button')
    await page.waitFor(1000);

    let emp = true;
    try {
      await page.waitFor('.employments', { timeout: 1000 })
    } catch (e) {
      emp = false
    }
    if (emp) {
      await page.click('td button');
      await page.waitFor(1000);
      await page.click('.row a.btn');
    }
    await page.waitFor('.chat-button');

    // go to the chat tab
    await page.click('.chat-button');
    await page.waitFor('.card-footer input.form-control');
    for (let i = 0; i < 20; i++) {
      await page.type('.card-footer input.form-control', 'chat message from user ' + userId + '\r');
      await page.waitFor(1200);
    }
  });

  for (let x = START_USER; x < END_USER; x++) {
    await cluster.queue(x);
  }
  // many more pages

  await cluster.idle();
  await cluster.close();
})();