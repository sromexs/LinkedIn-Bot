import { WebDriver } from "selenium-webdriver";
import fs from "fs";
import _ from "lodash";

export const getFollowListFromFollowers = () => {
  var asideEl = document.querySelector('aside[aria-label="Who to follow"]');
  if (asideEl) asideEl.outerHTML = "";

  var allAuthorsEls = document.querySelectorAll(
    `div > div > div > div > span > span`
  );

  let idAndNameArr: string[][] = [];

  allAuthorsEls.forEach((e) => {
    if (e.textContent === "Follow") {
      for (let i = 0; i < 5; i++) {
        e = e.parentElement!;
      }

      var anchor = e.querySelector("div > a") as HTMLAnchorElement;
      var id = anchor.getAttribute("href")?.replace("/", "");
      var name = anchor.textContent?.replace("@" + id, "").trim();
      if (id && name) idAndNameArr.push([id, name]);
    }
  });

  return idAndNameArr;
};

export const saveInSentList = (id: string) => {
  let list: string[] = [];
  if (fs.existsSync("database.json")) {
    list = JSON.parse(fs.readFileSync("database.json", "utf-8"));
  }
  list.push(id);
  fs.writeFileSync("database.json", JSON.stringify(_.uniq(list)), "utf-8");
};

export const getDifferenceWithOldList = (newList: [string, string][]) => {
  let list: string[] = [];
  if (fs.existsSync("database.json")) {
    list = JSON.parse(fs.readFileSync("database.json", "utf-8"));
  }

  return _.differenceWith(newList, list, (x, y) => _.isEqual(x[0], y));
};

export const myTweet = "https://twitter.com/sromexs/status/1275056802007257088";

export const commentBtn =
  "#react-root > div > div > div > main > div > div > div > div > div > div:nth-child(2) > div > section > div > div > div > div:nth-child(1) > div > div > div > div > article > div > div:nth-child(3) > div > div:nth-child(1) > div > div > div";
