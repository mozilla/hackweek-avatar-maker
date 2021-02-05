export function generateRandomConfig(assets) {
  const categoryNames = Object.keys(assets);
  const newConfig = {};
  for (const categoryName of categoryNames) {
    const categoryAssets = assets[categoryName].parts.filter((part) => !part.excludeFromRandomize);
    if (categoryAssets.length === 0) continue;
    const randomIndex = Math.floor(Math.random() * categoryAssets.length);
    newConfig[categoryName] = categoryAssets[randomIndex].value;
  }
  return newConfig;
}
