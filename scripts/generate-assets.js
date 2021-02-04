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

const categoryDescription = {
  Head: {
    Type: {
      regExp: /head_(.+)-skin/,
      hasNoneOption: true,
    },
    "Skin Tone": {
      regExp: /skin-[0-9a-z]/,
      hasNoneOption: false,
    }
  },
  Eyebrows: {
    Style: {
      regExp: /style-[0-9a-z]/,
      hasNoneOption: true,
    },
    Color: {
      regExp: /style-[0-9a-z]-(.+)/,
      hasNoneOption: false,
    }
  },
  Mouth: {
    Type: {
      regExp: /mouth_(.+)-skin/,
      hasNoneOption: true,
    },
    "Skin Tone": {
      regExp: /skin-[0-9a-z]/,
      hasNoneOption: false,
    }
  },
  Torso: {
    Type: {
      regExp: /style-[0-9a-z]/,
      hasNoneOption: true,
    },
    Outfit: {
      regExp: /style-[0-9a-z]-(.+)/,
      hasNoneOption: false,
    }
  },
};

function descriptionForPart({ category, filename }) {
  if (!categoryDescription[category]) return null;

  const template = categoryDescription[category];

  const description = {};
  for (const prop of Object.keys(template)) {
    const matches = filename.match(template[prop].regExp);
    if (!matches) {
      throw new Error(`Cannot generate description for part. "${filename}" does not match "${template[prop].regExp}".`);
    }
    description[prop] = matches.length > 1 ? matches[1] : matches[0];
  }
  return description;
}

function descriptionForCategory(categoryName, parts) {
  const description = {};

  for (const part of parts) {
    if (part.description) {
      for (const prop of Object.keys(part.description)) {
        description[prop] = description[prop] || new Set();
        description[prop].add(part.description[prop]);
      }
    }
  }

  for (const prop of Object.keys(description)) {
    description[prop] = Array.from(description[prop]);
    if (categoryDescription[categoryName][prop].hasNoneOption) {
      description[prop].unshift(null);
    }
  }

  return description;
}

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
      assets[category] = {};
    }

    if (!assets[category].parts) {
      assets[category].parts = [
        {
          value: null,
          displayName: "None",
          excludeFromRandomize: neverRandomizeToNone.includes(category),
        },
      ];
    }

    const part = {
      value: filename,
      displayName,
    };
    const description = descriptionForPart({ category, filename });
    if (description) {
      part.description = description;
    }

    assets[category].parts.push(part);
  }

  for (const categoryName of Object.keys(assets)) {
    const description = descriptionForCategory(categoryName, assets[categoryName].parts);
    if (Object.keys(description).length) {
      assets[categoryName].description = description;
    }
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
