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
    await driver.get("https://coinmarketcap.com/");
    const $openSignInModal = await driver.findElement(
      By.css('button[data-btnname="Log In"]')
    );
    await driver.wait(until.elementIsVisible($openSignInModal), 10000);
    await driver.wait(until.elementIsEnabled($openSignInModal), 10000);

    console.log($openSignInModal);

    //await driver.findElement(By.id('kw')).sendKeys('webdriver', Key.RETURN)
    await $openSignInModal.click();

    const email = await driver.findElement(
      By.css(".cmc-modal-body .email-input")
    );

    email.sendKeys("zhanglun1410@gmail.com");

    await driver
      .findElement(By.css(".cmc-modal-body .password-input"))
      .sendKeys("flzx3000c");

    const $modalBody = driver.findElement(By.css(".cmc-modal-body"));
    await $modalBody
      .findElement(By.css("//*[contains(text(), 'Log In')]"))
      .click();
  } catch (error) {
    console.log(error);
  } finally {
    await driver.quit();
  }
})();
