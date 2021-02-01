const fs = require("fs");
const path = require("path");

const excludeFromRandomize = ["Torso", "HeadNeckEars", "Hands", "Eyes", "Mouth", "Eyebrows"];

function generateAssetsStructure(directory) {
  const assetFileNames = fs.readdirSync(path.resolve(directory));

  const assets = {};

  for (const fullname of assetFileNames) {
    const filename = fullname.substring(0, fullname.lastIndexOf("."));

    let cleanName = filename;

    // Some of the GLBs have extra prefixes that we don't care about.
    if (["character_", "accessory_"].some((prefix) => filename.startsWith(prefix))) {
      cleanName = filename.substring(filename.indexOf("_") + 1);
    }

    let [category, ...nameParts] = cleanName.split("_");
    category = capitalize(category);

    if (!assets[category]) {
      assets[category] = [
        { value: null, displayName: "none", excludeFromRandomize: excludeFromRandomize.includes(category) },
      ];
    }

    assets[category].push({
      value: filename,
      displayName: capitalize(nameParts.join(" ")),
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
