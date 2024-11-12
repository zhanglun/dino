import { Builder, Browser, By, Key, until } from "selenium-webdriver";
import Chrome from "selenium-webdriver/chrome.js";

// https://coinmarketcap.com/account/my-diamonds/

(async function example() {
  const options = new Chrome.Options();

  options.addArguments("--disk-cache-dir=./cache");
  options.addArguments("--disk-cache-size=1000000");

  let driver = await new Builder()
    .forBrowser(Browser.CHROME)
    // .setChromeOptions(options.setPageLoadStrategy("eager"))
    .build();

  try {
    await driver.get("https://coinmarketcap.com/");

    const $openMenuButton = await driver.findElement(
      By.xpath(
        '//*[@id="__next"]/div[2]/div[1]/div[1]/div[2]/div[2]/div/div[4]/div[3]/div'
        // '//*[@id="__next"]/div[2]/div[1]/div[2]/div/div[1]/div[1]/section/section/div'
      )
    );

    await driver.sleep(3000);

    await driver.wait(until.elementIsEnabled($openMenuButton), 10000);

    console.log(
      "🚀 ~ file: coinmarketcup.mjs:58 ~ example ~ $openMenuButton:",
      await $openMenuButton.takeScreenshot()
    );

    await $openMenuButton.click();

    await driver.sleep(2000);

    const $loginButton = await driver.findElement(
      By.xpath(
        '//*[@id="__next"]/div[2]/div[1]/div[1]/div[2]/div[2]/div/div[3]/div[2]/div[2]/div[1]/button[2]'
      )
    );

    await driver.wait(until.elementIsVisible($loginButton), 5000);

    $loginButton.click();

    await driver.sleep(2000);

    const email = await driver.findElement(
      By.css(".cmc-modal-body .email-input")
    );

    email.sendKeys("zhanglun1410@gmail.com");

    await driver
      .findElement(By.css(".cmc-modal-body .password-input"))
      .sendKeys("flzx3000c");

    const $modalBody = driver.findElement(By.css(".cmc-modal-body"));
    await $modalBody
      .findElement(By.xpath('//button/div/div[text()="Log In"]'))
      .click();

    await driver.sleep(10000);
  } catch (error) {
    console.log(error);
  } finally {
    await driver.quit();
  }
})();
