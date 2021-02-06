export default async function retrySelector(page, selector, timeout = 100, retries = 100) {
  let element;
  for (let i = 0; i < retries; i++) {
    try {
      element = await page.waitForSelector(selector, { timeout });
      if (element) break;
    } catch (e) {}
  }
  return element;
}
