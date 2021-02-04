const fs = require("fs");
const path = require("path");

const neverRandomizeToNone = ["Torso", "Head", "Hands", "Eyes", "Mouth", "Eyebrows"];
const assetOrder = [
  "Hair",
  "Head",
  "Eyes",
  "Eyebrows",
  "Mouth",
  "Facial Hair",
  "Hands",
  "Torso",
  "Hat",
  "Eyewear",
  "Earring",
  "Accessory",
  "Torso Jacket",
];

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
        {
          value: null,
          displayName: "None",
          excludeFromRandomize: neverRandomizeToNone.includes(category),
        },
      ];
    }

    assets[category].push({
      value: filename,
      displayName,
    });
  }

  const orderedAssets = {};

  for (const category of assetOrder) {
    orderedAssets[category] = assets[category];
  }

  return orderedAssets;
}

const assets = generateAssetsStructure("./assets/models");
const result = `export default ${JSON.stringify(assets, null, 2)};`;

fs.writeFileSync("./src/assets.js", result);

function capitalize(str) {
  return str[0].toUpperCase() + str.substring(1);
}
