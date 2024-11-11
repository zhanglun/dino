import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // 打开浏览器，可视化操作
  const page = await browser.newPage(); // 创建一个新页面

  // 进入需要签到的网站
  await page.goto('https://www.coingecko.com/');

  // 在这里进行登录操作，填写用户名和密码等

  //await page.waitForNavigation();
  //const $openSignInModal = await page.waitForSelector('button[data-action="click->auth#openSignInModal"]');
  //const $openSignInModal2 = await page.waitForSelector('.zhanglun');

  console.log($openSignInModal);
  //console.log($openSignInModal2);
  //page.waitForSelector('button[data-action="click->auth#openSignInModal"]');
  //await $openSignInModal.click();
  //await page.click('button[data-action="click->auth#focusLogInEmailInput"');
  //
  //await page.type('#user_email', 'zhanglun1410@gmail.com');
  //await page.type('#user_password', 'flzx3000c');
  //await page.click('#loginButton');
  ////
  ////// 等待页面加载完成
  //await page.waitForNavigation();
  ////
  ////// 在这里执行签到操作，可以点击签到按钮或者填写签到表单等
  //await page.click('#collectButton');
  //
  //await page.click('button[data-action="click->refresh-csrf-token#submit"]');


  // 签到成功后的处理，可以截图、输出日志等
  console.log('Signed in successfully!');

  // 关闭浏览器
  //await browser.close();
})();
