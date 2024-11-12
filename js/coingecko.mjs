import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import Chrome from "selenium-webdriver/chrome.js";

(async function example() {
  const options = new Chrome.Options();

  // options.addArguments("--headless");
  // options.addArguments("--disable-css");
  options.addArguments("--disk-cache-dir=./cache");
  options.addArguments("--disk-cache-size=1000000");

  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options.setPageLoadStrategy("normal"))
    .build();

  try {
    await driver.get("https://www.coingecko.com/");
    const $openSignInModal = await driver.findElement(
      By.css(
        'div[data-controller="navbar"] button[data-action="click->auth#openSignInModal"]'
      )
    );
    await driver.wait(until.elementIsVisible($openSignInModal), 10000);
    await driver.wait(until.elementIsEnabled($openSignInModal), 10000);

    console.log($openSignInModal);

    //await driver.findElement(By.id('kw')).sendKeys('webdriver', Key.RETURN)
    await $openSignInModal.click();
    //
    const $showInputs = await driver.findElement(
      By.css('button[data-action="click->auth#focusLogInEmailInput"]')
    );
    await driver.wait(until.elementIsVisible($showInputs), 1000);

    await $showInputs.click();

    const email = await driver.findElement(By.id("user_email"));

    // await driver.wait(until.elementIsVisible(email), 10000);

    console.log(email);

    email.sendKeys("zhanglun1410@gmail.com");
    await driver.findElement(By.id("user_password")).sendKeys("flzx3000c");
    await driver
      .findElement(
        By.css('button[data-action="click->refresh-csrf-token#submit"]')
      )
      .click();
  } catch (error) {
    console.log(error);
  } finally {
    await driver.quit();
  }
})();
