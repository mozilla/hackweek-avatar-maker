function chooseWeightedRandom(parts) {
  const partsWithWeightInfo = parts.reduce(
    (acc, part) => {
      const partWeight = part.randomizationWeight || 1;

      acc.parts.push({
        value: part.value,
        minValue: acc.sum,
        maxValue: acc.sum + partWeight,
      });

      acc.sum += partWeight;

      return acc;
    },
    { parts: [], sum: 0 }
  );

  const randomNum = Math.random() * partsWithWeightInfo.sum;

  return partsWithWeightInfo.parts.find((info) => randomNum >= info.minValue && randomNum < info.maxValue);
}

function maybeReplaceWithMatchingCategory(assets, newConfig, categoryName) {
  const category = assets[categoryName];

  if (newConfig[categoryName] === null || !category.matchRandomization) return;

  const categoryNameToMatch = category.matchRandomization.categoryName;

  const partToMatch = assets[categoryNameToMatch].parts.find((part) => part.value === newConfig[categoryNameToMatch]);

  // Some parts in the other category should never result in a random part chosen from this category
  if (partToMatch.matchRandomizationToNull) {
    newConfig[categoryName] = null;
    return;
  }

  if (!partToMatch.description) return;

  const currentPart = category.parts.find((part) => part.value === newConfig[categoryName]);

  const { primaryOption, secondaryOption } = category.matchRandomization;

  const matchingAsset = category.parts.find((part) => {
    return (
      part.description &&
      currentPart.description &&
      part.description[primaryOption] === partToMatch.description[primaryOption] &&
      part.description[secondaryOption] === currentPart.description[secondaryOption]
    );
  });

  if (matchingAsset) {
    newConfig[categoryName] = matchingAsset.value;
  } else {
    // If we don't find an exact match for the secondaryOption, 
    // we should find a random part that matches the desired primaryOption.
    const randomMatchingAsset = chooseWeightedRandom(
      category.parts.filter((part) => {
        return (
          part.description &&
          part.description[primaryOption] === partToMatch.description[primaryOption]
        );
      })
    );
    if (randomMatchingAsset) {
      newConfig[categoryName] = randomMatchingAsset.value;
    }
  }
}

export function generateRandomConfig(assets) {
  const categoryNames = Object.keys(assets);
  const newConfig = {};

  for (const categoryName of categoryNames) {
    const categoryAssets = assets[categoryName].parts.filter((part) => !part.excludeFromRandomize);
    if (categoryAssets.length === 0) continue;

    newConfig[categoryName] = chooseWeightedRandom(categoryAssets).value;
  }

  // We want to match some categories to the primary option choosen in another category.
  for (const categoryName of categoryNames) {
    maybeReplaceWithMatchingCategory(assets, newConfig, categoryName);
  }

  return newConfig;
}
