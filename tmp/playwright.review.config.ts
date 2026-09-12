import { defineConfig } from '@playwright/test';
import config from '../playwright.config';
export default defineConfig({ ...config, testDir: '../tests', use: { ...config.use, baseURL: 'http://localhost:4123' }, webServer: undefined, workers: 2 });
