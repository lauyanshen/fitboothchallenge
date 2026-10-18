import { defineConfig } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "4174";
const basePath = process.env.VITE_BASE_PATH || "/";
const url = `http://127.0.0.1:${port}${basePath}`;
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  use: {
    baseURL: url,
    viewport: { width: 1440, height: 1024 },
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: !process.env.CI,
  },
});
