import {
  clickByJavascript,
  createData,
  moveToElement,
  buildDrive,
  waitToFindElementByXpath,
  sleep,
} from "./functions/fn.index";

(async () => {
  createData();
  const drive = await buildDrive();
  await drive.manage().window().maximize();
  let totalLikes = 0;

  while (true) {
    try {
      await drive.get(
        "https://www.linkedin.com/search/results/content/" +
          "?keywords=javascript&origin=FACETED_SEARCH&sortBy=%22date_posted%22"
      );

      const firstProfileAnchor = await waitToFindElementByXpath(
        drive,
        "(//ul/child::li/child::div[@class='entity-result']" +
          "[descendant::a[1][not(contains(@href,'company'))]])[1]" +
          "/descendant::a[1]"
      );

      const profileLink = await firstProfileAnchor?.getAttribute("href");

      if (!profileLink) {
        throw new Error("String is empty!");
      }

      let link: string;
      await drive.get((link = profileLink));

      while (link.includes(profileLink)) {
        await sleep(1000);
        link = await drive.getCurrentUrl();
      }

      console.log({ link });

      await drive.get(link + "detail/recent-activity/");

      await drive
        .manage()
        .window()
        .setRect({ x: 0, y: 0, width: 20, height: 20 });
      await sleep(500);
      await drive.manage().window().maximize();

      const firstLikeBtn = await waitToFindElementByXpath(
        drive,
        "//button[@aria-pressed='false' and contains(@aria-label,'Like')]"
      );

      if (!firstLikeBtn) {
        throw new Error("First like button not found!");
      }

      await moveToElement(drive, firstLikeBtn);
      await sleep(2000);
      await clickByJavascript(drive, firstLikeBtn);

      totalLikes++;
      console.log({ totalLikes });

      for (let i = 15; i > 0; i--) {
        console.log({ status: "Sleep", minute: i });
        await sleep(60000);
      }
    } catch (err) {
      console.log(err);
      await sleep(5 * 60000);
    }
  }
})();
