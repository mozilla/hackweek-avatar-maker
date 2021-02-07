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
