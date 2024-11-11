import { Builder, Browser, By, Key, until } from 'selenium-webdriver'
import Chrome from 'selenium-webdriver/chrome.js';

(async function example() {
  const options = new Chrome.Options();
  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options.setPageLoadStrategy('eager'))
    .build()

  try {
    await driver.get('https://www.coingecko.com/')
    const $openSignInModal = await driver.findElement(By.css('div[data-controller="navbar"] button[data-action="click->auth#openSignInModal"]'));
    await driver.wait(until.elementIsVisible($openSignInModal), 5000);

    console.log($openSignInModal)
    //await driver.findElement(By.id('kw')).sendKeys('webdriver', Key.RETURN)
    await $openSignInModal.click();

    const $showInputs = await driver.findElement(By.css('button[data-action="click->auth#focusLogInEmailInput"]'));
    await driver.wait(until.elementIsVisible($showInputs), 1000);

    await driver.findElement(By.id('user_email')).sendKeys('zhanglun1410@gmail.com');
    await driver.findElement(By.id('user_password')).sendKeys('flzx3000c');
    //await driver.findElement(By.css('button[action="click->refresh-csrf-token#submit"]')).click();

  } finally {
    await driver.quit()
  }
})()
