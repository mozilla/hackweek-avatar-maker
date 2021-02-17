import path from "path";
import fs from "fs";
import readline from "readline";
import puppeteer from "puppeteer";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import promptSync from "prompt-sync";
const prompt = promptSync();

import options from "./options";
import retrySelector from "./utils/retry-selector";
import assets from "../../src/assets";
import constants from "../../src/constants";

// Use these options by running `npm run gen-thumbnails -- --option`
const { argv } = yargs(hideBin(process.argv))
  .options(options)
  .version(false)
  .parserConfiguration({ "boolean-negation": false });

const host = argv.host || "localhost:8080";

const outputPath = path.resolve(__dirname, "..", "..", "assets", "thumbnails");

if (!argv.dryRun) {
  if (fs.existsSync(outputPath)) {
    if (!argv.noClean) {
      const promptText = "Are you sure you want to delete all existing thumbnails? [y/N] ";
      if (argv.forceClean || prompt(promptText).toLowerCase() === "y") {
        fs.rmdirSync(outputPath, { recursive: true });
        fs.mkdirSync(outputPath);
      } else {
        console.log("Exiting.");
        process.exit(0);
      }
    }
  } else {
    fs.mkdirSync(outputPath);
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: !argv.noHeadless });

  const page = await browser.newPage();

  if (argv.browserLogs) {
    page.on("console", (msg) => {
      console.log("browser log: ", msg.text());
    });

    page.on("pageerror", (err) => {
      console.log("browser error: ", err);
    });
  }

  await page.goto(`http://${host}/?thumbnail`);

  async function generateThumbnail(category, part) {
    await page.evaluate(
      (constants, category, part) => {
        const result = document.getElementById(constants.thumbnailResult);
        if (result) {
          URL.revokeObjectURL(result.src);
          result.remove();
        }
        window.renderThumbnail(category, part);
      },
      constants,
      category,
      part
    );

    const result = await retrySelector(page, `#${constants.thumbnailResult}`);
    await page.evaluate((result) => result.scrollIntoView(), result);

    const screenshotParams = { type: "jpeg", quality: 95 };

    if (!argv.dryRun) {
      screenshotParams.path = path.join(outputPath, `${part}.jpg`);
    }

    await result.screenshot(screenshotParams);
  }

  let thumbnailsToGenerate = [];

  for (const [category, { parts }] of Object.entries(assets)) {
    for (const part of parts) {
      if (part.value === null) continue;
      thumbnailsToGenerate.push({ category, part: part.value });
    }
  }

  if (argv.limit) {
    thumbnailsToGenerate = thumbnailsToGenerate.slice(0, argv.limit);
  }

  const start = Date.now();
  for (let i = 0; i < thumbnailsToGenerate.length; i++) {
    const { category, part } = thumbnailsToGenerate[i];
    console.log(`[${i + 1}/${thumbnailsToGenerate.length}] Generating ${category} ${part}`);
    await generateThumbnail(category, part);
  }
  const elapsedSeconds = (Date.now() - start) / 1000;
  console.log(`Generated ${thumbnailsToGenerate.length} thumbnails in ${elapsedSeconds.toFixed(0)} seconds.`);

  await browser.close();
})();
