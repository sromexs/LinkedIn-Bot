import {
  clickByActions,
  createData,
  moveToElement,
} from "./functions/LinkedIn.fn";
import {
  buildDrive,
  waitToFindElementByXpath,
  sleep,
  waitToFindElementsByXpath,
} from "./functions/LinkedIn.fn";

(async () => {
  createData();
  const drive = await buildDrive();
  await drive.manage().window().maximize();

  while (true) {
    try {
      await drive.get(
        "https://www.linkedin.com/feed/hashtag/?keywords=javascript"
      );

      const sortStrongBtn = await waitToFindElementByXpath(
        drive,
        '//button[@data-control-name="feed_sort_dropdown_trigger"]' +
          "/child::strong"
      );

      if (!sortStrongBtn) {
        throw new Error("Sort top button not found!");
      }

      if ((await sortStrongBtn.getText()).trim() === "Top") {
        await sleep(1000);
        await clickByActions(drive, sortStrongBtn);

        const buttonRecent = await waitToFindElementByXpath(
          drive,
          "//ul[contains(@class,'sort-dropdown')]" +
            "/descendant::span[text()='Recent']" +
            "/parent::button",
          3000
        );

        if (!buttonRecent) {
          throw new Error("Recent button not exists!");
        }

        await clickByActions(drive, buttonRecent);
        await sleep(3000);
      }

      const posts = await waitToFindElementsByXpath(
        drive,
        "//h1[not(contains(@class,'global'))]" +
          "/following-sibling::div" +
          "/child::div[descendant::a[1][not(contains(@href,'company'))]]" +
          "/descendant::button[@aria-pressed='false' and contains(@aria-label,'Like')]",
        3000
      );

      if (!posts) {
        throw new Error("There is no likable element!");
      }

      for (const post of posts) {
        try {
          await moveToElement(drive, post);
          await sleep(2000);
          await clickByActions(drive, post);
          break;
        } catch (err) {
          console.log(err);
        }
      }

      console.log({ status: "wait", minute: 15 });
      await await sleep(15 * 60000);
    } catch (err) {
      console.log(err);
      await sleep(5 * 60000);
    }
  }
})();
