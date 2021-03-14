import os from "os";
import chrome from "selenium-webdriver/chrome";
import {
  Builder,
  By,
  WebDriver,
  until,
  WebElement,
  Key,
} from "selenium-webdriver";
import fs from "fs-extra";

// export const initiate = () => {
//   bdff.mkdir(["browser"]);
// };

const chromeDir = `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\`;

export const createData = () => {
  if (!fs.existsSync("browser")) {
    console.log("Making data ...");
    fs.copySync(chromeDir + "User Data", "browser");
    console.log("Browser folder created");
  }
};

export const buildDrive = (profileDir = "browser") => {
  const chromeOptions = new chrome.Options();
  chromeOptions.addArguments(`--user-data-dir=${profileDir}`);
  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();
};

export const waitToFindElementByXpath = async (
  drive: WebDriver,
  xpath: string,
  timeout = 10000
) => {
  try {
    return await drive.wait(until.elementLocated(By.xpath(xpath)), timeout);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const waitToFindElementsByXpath = async (
  drive: WebDriver,
  xpath: string,
  timeout = 10000
) => {
  try {
    return await drive.wait(until.elementsLocated(By.xpath(xpath)), timeout);
  } catch (err) {
    console.log(err);
    return null;
  }
};

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const clickByJavascript = (drive: WebDriver, element: any) => {
  return drive.executeScript("arguments[0].click()", element);
};

export const clickByActions = (drive: WebDriver, element: WebElement) => {
  return drive.actions().move({ origin: element }).press().release().perform();
};

export const moveToElement = (drive: WebDriver, element: WebElement) => {
  return drive.executeScript(() => {
    // @ts-ignore
    arguments[0].scrollIntoView({
      behavior: "auto",
      block: "center",
      inline: "center",
    });
  }, element);
};

// export const pickRandomItem = (params) => {};
