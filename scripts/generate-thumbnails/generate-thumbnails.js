import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import assets from "../../src/assets";
import constants from "../../src/constants";

const host = "localhost:8080";

const outputPath = path.resolve(__dirname, "..", "..", "assets", "thumbnails");
if (fs.existsSync(outputPath)) {
  fs.rmdirSync(outputPath, { recursive: true });
}
fs.mkdirSync(outputPath);

async function retrySelector(page, selector, timeout = 100, retries = 100) {
  let element;
  for (let i = 0; i < retries; i++) {
    try {
      element = await page.waitForSelector(selector, { timeout });
      if (element) break;
    } catch (e) {}
  }
  return element;
}

(async () => {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();
  await page.goto(`http://${host}/?thumbnail`);

  async function generateThumbnail(category, part) {
    await page.evaluate(
      (constants, category, part) => {
        const result = document.getElementById(constants.thumbnailResult);
        if (result) result.remove();
        window.renderThumbnail(category, part);
      },
      constants,
      category,
      part
    );

    const result = await retrySelector(page, `#${constants.thumbnailResult}`);
    await page.evaluate((result) => result.scrollIntoView(), result);

    await result.screenshot({ path: path.join(outputPath, `${part}.png`) });
  }

  let thumbnailsToGenerate = [];
  for (const [category, parts] of Object.entries(assets)) {
    for (const part of parts) {
      if (part.value === null) continue;
      thumbnailsToGenerate.push({ category, part: part.value });
    }
  }
  thumbnailsToGenerate = thumbnailsToGenerate.slice(0, 10);

  for (let i = 0; i < thumbnailsToGenerate.length; i++) {
    const { category, part } = thumbnailsToGenerate[i];
    console.log(`[${i + 1}/${thumbnailsToGenerate.length}] generating ${category} ${part}`);
    await generateThumbnail(category, part);
  }

  await browser.close();
})();
