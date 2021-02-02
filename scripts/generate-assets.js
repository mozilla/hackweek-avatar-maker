const fs = require("fs");
const path = require("path");

const excludeFromRandomize = ["Torso", "HeadNeckEars", "Hands", "Eyes", "Mouth", "Eyebrows"];

function generateAssetsStructure(directory) {
  const assetFileNames = fs.readdirSync(path.resolve(directory));

  const assets = {};

  for (const fullname of assetFileNames) {
    const filename = fullname.substring(0, fullname.lastIndexOf("."));

    let [hyphenatedCategory, hyphenatedName] = filename.split("_");
    category = hyphenatedCategory
      .split("-")
      .map((p) => capitalize(p))
      .join(" ");
    displayName = hyphenatedName
      .split("-")
      .map((p) => capitalize(p))
      .join(" ");

    if (!assets[category]) {
      assets[category] = [
        { value: null, displayName: "none", excludeFromRandomize: excludeFromRandomize.includes(category) },
      ];
    }

    assets[category].push({
      value: filename,
      displayName,
    });
  }

  return assets;
}

const assets = generateAssetsStructure("./assets");
const result = `export default ${JSON.stringify(assets, null, 2)};`;

fs.writeFileSync("./src/assets.js", result);

function capitalize(str) {
  return str[0].toUpperCase() + str.substring(1);
}
