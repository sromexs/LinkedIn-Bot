import _ from "lodash";
import { By, until } from "selenium-webdriver";
import { isAllowToFollow, addTodayFollowCount } from './functions/app.fn';
import {
  isFollowedBack,
  removeFromFollowed,
  unFollow,
  followUser,
  sleepEachLoop,
  getOutDatedFollowed,
  getTweetsUserPageLink,
  saveLinksToJson,
  init,
  getOneFromCrawls,
  initiateDriver,
  sleep,
  getMainPageTweetsLink,
  isFollowing,
} from "./functions/app.fn";

(async function example() {
  const driver = await initiateDriver();
  while (true) {
    try {
      init();
      driver.manage().window().maximize();

      if (!isAllowToFollow()) {
        console.log({ isAllowToFollow: false });
        await sleepEachLoop();
        continue;
      }

      for (const following of getOutDatedFollowed()) {
        await driver.get(following.link);

        if (!(await isFollowing(driver))) {
          removeFromFollowed(following.link);
          continue;
        }

        if (await isFollowedBack(driver)) {
          removeFromFollowed(following.link);
          continue;
        }

        await unFollow(driver);
        removeFromFollowed(following.link);
        break;
      }

      const crawl = getOneFromCrawls();
      console.log({ crawl });

      if (crawl) {
        await driver.get(crawl);
        await followUser(driver, crawl);
        addTodayFollowCount()
        await sleepEachLoop();
        continue;
      }

      const tweetIds = await getMainPageTweetsLink(driver);
      const links = await getTweetsUserPageLink(driver, tweetIds);
      saveLinksToJson(links);
    } catch (err) {
      console.log(err);
      await sleep(10000);
    }
  }
})();
