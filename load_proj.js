const { Cluster } = require('puppeteer-cluster');
const START_USER = 0;
const END_USER = 16;

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 8,
    monitor: true,
    workerCreationDelay: 200
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
    await page.waitFor('.new-project-wrapper button');

    // go to the chat tab
    await page.click('.new-project-wrapper button');
    await page.waitFor('.project-create');
    await page.click('#customer_type_new_customer');
    await page.waitFor('#project_customer_email');
    await page.screenshot();
  });

  for (let x = START_USER; x < END_USER; x++) {
    await cluster.queue(x);
  }
  // many more pages

  await cluster.idle();
  await cluster.close();
})();