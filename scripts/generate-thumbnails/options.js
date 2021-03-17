export default {
  "no-headless": {
    type: "boolean",
    description: "Run with a visible browser",
  },
  "no-clean": {
    type: "boolean",
    description: "Don't clear the output directory before generating thumbnails",
  },
  "force-clean": {
    type: "boolean",
    description: "Don't ask about clearing the output directory",
  },
  "only-new": {
    type: "boolean",
    description: "Only generate thumbnails for changed or new models. Implies --no-clean",
  },
  "browser-logs": {
    alias: "b",
    type: "boolean",
    description: "Show logs from the browser context",
  },
  limit: {
    alias: "l",
    type: "number",
    description: "Limit generation to the first n assets",
  },
  "filter": {
    alias: "f",
    type: "string",
    description: "Filter assets to ones that contain this string",
  },
  "dry-run": {
    alias: "d",
    type: "boolean",
    description: "Don't actually modify files",
  },
  host: {
    alias: "o",
    type: "number",
    description: "Host that is running the app",
  },
};
