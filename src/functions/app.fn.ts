import fs from "fs-extra";
import chrome from "selenium-webdriver/chrome";
import { WebDriver } from "selenium-webdriver";
import _ from "lodash";
import webdriver, {
  Builder,
  By,
  Key,
  until,
  Options,
  Capabilities,
} from "selenium-webdriver";
import os from "os";

import moment from "moment-timezone";

const isDev = true;

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const initiateDriver = () => {
  const chromeOptions = new chrome.Options();

  const chromeDir = `${os.homedir()}\\AppData\\Local\\Google\\Chrome\\`;

  // if (fs.existsSync("virtual")) {
  //   fs.rmdirSync(chromeDir + "virtual", { recursive: true });
  // }

  // fs.copySync(chromeDir + "User Data", chromeDir + "virtual");

  chromeOptions.addArguments(`--user-data-dir=${chromeDir}User Data`);

  if (isDev)
    return new Builder()
      .forBrowser("chrome")
      .setChromeOptions(chromeOptions)
      .build();

  const extension = fs.readFileSync("vpn.crx", "base64");
  chromeOptions.addExtensions(extension);

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(chromeOptions)
    .build();
};

export const waitUntilElementLocated = async (
  driver: WebDriver,
  xpath: string,
  timeout: number = 10000
) => {
  await driver.wait(until.elementLocated(By.xpath(xpath)), timeout);
};

export const removePromotedTweets = async (driver: WebDriver) => {
  const promotes = await driver.findElements(
    By.xpath(
      "//span[contains(text(),'Promote')]/ancestor::article/parent::*/parent::*/parent::*"
    )
  );

  for (const promote of promotes) {
    await driver.executeScript(() => {
      // @ts-ignore
      arguments[0].outerHTML = "";
    }, promote);
  }
};

export const getMainPageTweetsLink = async (driver: WebDriver) => {
  const xpath =
    "//article[@role='article']/descendant::a[contains(@href,'/status/')]";

  await waitUntilElementLocated(driver, xpath);

  await sleep(3000);

  await removePromotedTweets(driver);

  await sleep(2000);

  const tweetLinks = await driver.findElements(By.xpath(xpath));

  const links: string[] = [];

  for (const tweet of tweetLinks) {
    links.push(await tweet.getAttribute("href"));
  }

  if (tweetLinks.length === 0) {
    return [];
  }

  const tweetIds = links
    .map((e) => {
      const match = /(?<=\/status\/)\d+/.exec(e);
      return match ? match[0] : "";
    })
    .filter(Boolean);

  const uniqueIds = [...new Set(tweetIds)];
  console.log({ uniqueIds });
  return uniqueIds;
};

export const getTweetsUserPageLink = async (
  driver: WebDriver,
  tweetIds: string[]
) => {
  const xpath = [
    "//span[contains(text(),'Liked by')]",
    "/ancestor::div[@role='dialog']",
    "/descendant::span[text() = 'Follow']",
    "/ancestor::div[@role='button']",
    "/descendant::a[contains(@href,'/')]",
    "/descendant::span[contains(text(),'@')]",
    "/ancestor::a",
  ].join("");

  let userPages: string[] = [];

  for (const id of tweetIds) {
    await driver.get(`https://twitter.com/e/status/${id}/likes`);
    await sleep(3000);
    const anchors = await driver.findElements(By.xpath(xpath));
    console.log({ anchors: anchors.length });
    for (const anchor of anchors) {
      const singleLink = await anchor.getAttribute("href");
      console.log({ singleLink });
      userPages.push(singleLink);
    }
    userPages = userPages.filter((e) => !e.includes("search"));
  }

  return userPages;
};

export const saveLinksToJson = (links: string[]) => {
  fs.writeFileSync("crawls.json", JSON.stringify(links, null, 4));
};

export const init = () => {
  if (!fs.existsSync("crawls.json")) {
    fs.writeFileSync("crawls.json", JSON.stringify([]));
  }

  if (!fs.existsSync("sleep.json")) {
    fs.writeFileSync("sleep.json", JSON.stringify(15));
  }

  if (!fs.existsSync("perDay.json")) {
    fs.writeFileSync("perDay.json", JSON.stringify(50));
  }

  if (!fs.existsSync("unFollowAfterDay.json")) {
    fs.writeFileSync("unFollowAfterDay.json", JSON.stringify(7));
  }

  if (!fs.existsSync("today")) {
    fs.mkdirSync("today");
  }

  if (!fs.existsSync("today/" + getTodayName())) {
    fs.writeFileSync("today/" + getTodayName(), JSON.stringify(0));
  }
};

export const getOneFromCrawls = () => {
  try {
    const array = JSON.parse(
      fs.readFileSync("crawls.json", "utf-8")
    ) as string[];
    if (array.length === 0) {
      return null;
    }
    const link = array.pop();
    fs.writeFileSync("crawls.json", JSON.stringify(array, null, 4));
    return link;
  } catch (err) {
    console.log(err);
    return null;
  }
};

type TFollowed = {
  link: string;
  time: number;
};

export const addUserToFollowedList = (link: string) => {
  const links = (() => {
    try {
      return JSON.parse(
        fs.readFileSync("followed.json", "utf-8")
      ) as TFollowed[];
    } catch (err) {
      return [];
    }
  })();

  const follow: TFollowed = {
    link,
    time: new Date().getTime(),
  };

  links.push(follow);

  fs.writeFileSync("followed.json", JSON.stringify(links, null, 4));

  console.log(follow);
  console.log({ status: "saved" });
};

export const followUser = async (driver: WebDriver, link: string) => {
  const followBtn = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[@data-testid='primaryColumn']/descendant::span[contains(text(),'Follow')]"
      )
    ),
    10000
  );

  const btnText = await followBtn.getText();
  const follow = btnText === "Follow";

  if (follow) await followBtn.click();
  console.log({ btnText, follow: follow });
  addUserToFollowedList(link);
  await sleep(3000);
};

export const sleepEachLoop = async () => {
  let minute = (() => {
    try {
      return JSON.parse(fs.readFileSync("sleep.json", "utf-8")) as number;
    } catch (err) {
      return 50;
    }
  })();

  while (minute) {
    console.log({ sleep: minute + " minute" });

    await sleep(60000);
    minute--;
  }
};

export const getOutDatedFollowed = () => {
  let array = (() => {
    try {
      return JSON.parse(
        fs.readFileSync("followed.json", "utf-8")
      ) as TFollowed[];
    } catch (err) {
      return [];
    }
  })();

  const unFollowAfterDay = (() => {
    try {
      return JSON.parse(
        fs.readFileSync("unFollowAfterDay.json", "utf-8")
      ) as number;
    } catch (err) {
      fs.writeFileSync("unFollowAfterDay.json", JSON.stringify(7));
      return 7;
    }
  })();

  console.log({ unFollowAfterDay });

  const timeout = unFollowAfterDay * 1000 * 60 * 60 * 24;
  const now = new Date().getTime();

  array = array.filter((e) => {
    const difference = now - e.time;
    return difference > timeout;
  });

  return array;
};

export const isFollowing = async (driver: WebDriver) => {
  const followBtn = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[@data-testid='primaryColumn']/descendant::span[contains(text(),'Follow')]"
      )
    ),
    10000
  );

  const btnText = await followBtn.getText();
  const isFollowing = btnText === "Following";

  console.log({ btnText, isFollowing });

  return isFollowing;
};

export const isFollowedBack = async (driver: WebDriver) => {
  try {
    await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[@data-testid='primaryColumn']/descendant::div/child::span[text() = 'Follows you']"
        )
      ),
      5000
    );

    return true;
  } catch (err) {
    return false;
  }
};

export const removeFromFollowed = (link: string) => {
  let array = (() => {
    try {
      return JSON.parse(
        fs.readFileSync("followed.json", "utf-8")
      ) as TFollowed[];
    } catch (err) {
      return [];
    }
  })();

  array = array.filter((e) => e.link !== link);

  fs.writeFileSync("followed.json", JSON.stringify(array, null, 4));

  console.log({ link, status: "Removed" });
};

export const unFollow = async (driver: WebDriver) => {
  const followBtn = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//div[@data-testid='primaryColumn']/descendant::span[contains(text(),'Follow')]"
      )
    ),
    10000
  );

  const btnText = await followBtn.getText();
  if (btnText === "Follow") return;

  await followBtn.click();

  const unFollowBtn = await driver.wait(
    until.elementLocated(By.xpath("//span[text()='Unfollow']")),
    5000
  );

  await unFollowBtn.click();
  console.log({ status: "UnFollowed" });
  await sleep(2000);
};

export const getTodayName = () => {
  const today = moment().tz("Asia/Tehran").format("YYMMDD") + ".json";
  return today;
};

export const addTodayFollowCount = () => {
  let number = (() => {
    try {
      return Number(
        JSON.parse(fs.readFileSync("today/" + getTodayName(), "utf-8"))
      );
    } catch (err) {
      init();
      fs.writeFileSync("today/" + getTodayName(), JSON.stringify(0));
      return 0;
    }
  })();

  console.log({ number });
  fs.writeFileSync("today/" + getTodayName(), JSON.stringify(++number));
};

export const isAllowToFollow = () => {
  removeExtraFilesToday();
  
  const perDay = (() => {
    try {
      return Number(JSON.parse(fs.readFileSync("perDay.json", "utf-8")));
    } catch (err) {
      fs.writeFileSync("perDay.json", JSON.stringify(50));
      return 50;
    }
  })();

  const number = (() => {
    try {
      return Number(
        JSON.parse(fs.readFileSync("today/" + getTodayName(), "utf-8"))
      );
    } catch (err) {
      init();
      fs.writeFileSync("today/" + getTodayName(), JSON.stringify(0));
      return 0;
    }
  })();

  console.log({ perDay, number });

  return perDay - number > 0;
};

export const removeExtraFilesToday = () => {
  fs.readdirSync("today")
    .filter((e) => e !== getTodayName())
    .forEach((e) => {
      console.log({ file: e, status: "Removed" });
      fs.unlinkSync("today/" + e);
    });
};
