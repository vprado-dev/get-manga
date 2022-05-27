const withBrowser = require("./withBrowser");
const fetch = require("node-fetch");
const path = require("path");
const fs = require("fs-extra");
const { Page } = require("puppeteer");

const downloadBase64 = async (page, downloadUrl) => {
  console.log(downloadUrl);

  await new Promise((resolve) => setTimeout(resolve, 1000000));

  const base64 = await page.evaluate(async (url) => {
    const arrayBufferToBase64 = (buffer) => {
      let binary = "";

      const bytes = new Uint8Array(buffer);

      const len = bytes.byteLength;

      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      return window.btoa(binary);
    };

    const response = await fetch(url);

    const bufferArr = await response.arrayBuffer();

    const base64 = arrayBufferToBase64(bufferArr);

    return base64;
  }, downloadUrl);

  return base64;
};

const getChaptersLinks = async (page) => {
  await page.waitForSelector(".row-content-chapter");
  const links = await page.evaluate(() => {
    const anchors = Array.from(
      document.querySelectorAll(".row-content-chapter > .a-h > a")
    );

    const links = anchors.map((item) => item.href).slice(0, 1);

    return links.reverse();
  });

  return links;
};

/**
 *
 * @param {*} link
 * @param {Page} page
 */
const gotToChapterPageAndDownloadImages = async (link, page) => {
  await page.setRequestInterception(true);

  const MANGA_PATH = path.join(__dirname, "..", "teste/");

  await fs.mkdirp(MANGA_PATH);

  page.on("response", async (response) => {
    if (/img/.test(response.url())) {
      const buffer = await response.buffer();

      const base = path.basename(response.url());

      const filepath = path.join(MANGA_PATH, base);

      await fs.promises.writeFile(filepath, buffer);
    }
  });

  page.on("request", (request) => {
    request.continue();
  });

  await page.goto(link);

  await new Promise((resolve) => setTimeout(resolve, 100000));
};

const getMangaChaptersImages = async (links, browser) => {
  const promises = links.map(async (link) => {
    const page = await browser.newPage();
    await gotToChapterPageAndDownloadImages(link, page);
  });

  await Promise.all(promises);
};

const getMangaName = async (page) => {
  const mangaNameSelector = ".story-info-right > h1";

  await page.waitForSelector(mangaNameSelector);
  const element = await page.$(mangaNameSelector);

  const mangaName = await element.evaluate((el) => el.textContent);

  return mangaName;
};

/**
 *
 * @param {string} dirPath
 * @returns {Promise<boolean>}
 */
export const checkDirectoryExists = async (dirPath) => {
  try {
    const stat = await fs.promises.stat(dirPath);

    return stat.isDirectory();
  } catch (err) {
    if (err && err.code == "ENOENT") {
      return false;
    }
    throw err;
  }
};

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

    await page.goto(link);

    const mangaName = await getMangaName(page);

    console.log({ mangaName });

    const links = await getChaptersLinks(page);

    /** TODO: Check if folder already exists */
    const mangaPath = path.join(__dirname, "..", "mangas", `${mangaName}`);
    const directoryAlreadyExists = await checkDirectoryExists(mangaPath);
    while (links.length) {
      await getMangaChaptersImages(links.splice(0, 10), browser);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
  });
};

module.exports = getMangaPages;
