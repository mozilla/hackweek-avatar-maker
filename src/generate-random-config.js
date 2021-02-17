export function generateRandomConfig(assets) {
  const categoryNames = Object.keys(assets);
  const newConfig = {};
  for (const categoryName of categoryNames) {
    const categoryAssets = assets[categoryName].parts.filter((part) => !part.excludeFromRandomize);
    if (categoryAssets.length === 0) continue;

    const assetsWithWeightInfo = categoryAssets.reduce(
      (acc, asset, i) => {
        const assetWeight = asset.randomizationWeight || 1;
        acc.assets.push({
          value: asset.value,
          minValue: acc.sum,
          maxValue: acc.sum + assetWeight,
        });

        acc.sum += assetWeight;

        return acc;
      },
      { assets: [], sum: 0 }
    );

    const randomValue = Math.random() * assetsWithWeightInfo.sum;
    newConfig[categoryName] = assetsWithWeightInfo.assets.find(
      (info) => randomValue >= info.minValue && randomValue < info.maxValue
    ).value;
  }
  return newConfig;
}
