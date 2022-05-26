const withBrowser = require("./withBrowser");

const getMangaPages = async (manga) => {
  await withBrowser(async (browser, page) => {
    await page.setUserAgent(process.env.USER_AGENT || "");

    await page.goto("https://mangakakalot.com");

    await page.waitForSelector("#search_story");
    await page.type("#search_story", manga);
    await page.keyboard.press("Enter");

    await page.waitForSelector(".panel_story_list");

    const link = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll(".story_item > a"));

      return links.shift().href;
    });

    console.log(link);

    await page.goto(link);

    await page.waitForSelector(".row-content-chapter");

    const links = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll(".row-content-chapter > .a-h > a")
      );

      const links = anchors.map((item) => item.href);

      return links.reverse();
    });

    console.log({ links });

    await new Promise((resolve) => setTimeout(resolve, 10000));
  });
};

module.exports = getMangaPages;
