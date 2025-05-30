import {defineConfig, devices} from '@playwright/test';

const PORT = process.env.PORT || 5173;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 3 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: baseURL,
        trace: 'on-first-retry',
    },

    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
        },

        {
            name: 'firefox',
            use: {...devices['Desktop Firefox']},
        },

        {
            name: 'webkit',
            use: {...devices['Desktop Safari']},
        },

        {
            name: 'Mobile Chrome',
            use: {...devices['Pixel 5']},
        },
        {
            name: 'Mobile Safari',
            use: {...devices['iPhone 12']},
        }
    ],

    webServer: {
        command: `vite dev --host --port ${PORT}`,
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
    }
});

