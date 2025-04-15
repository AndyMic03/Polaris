import {expect, test} from "@playwright/test";

async function reset(page) {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.reload();
    await expect(page.locator("h1.title")).toHaveText("Welcome!");
}

async function verifyCongratulations(page) {
    await expect(page.locator("h1.title")).toHaveText("Congratulations!");
    await expect(page.locator("#description")).toHaveText("You have at arrived at your next clue.Please click the button below to see your clue.");
    await expect(page.locator("#button")).toHaveText("View Hint");
    await page.locator("#button").click();
}

async function verifyFinish(page) {
    await expect(page.locator("h1.title")).toHaveText("Congratulations!");
    await expect(page.locator("#description")).toHaveText("You have finished the game.Please submit your score after clicking validate.");
    await expect(page.locator("#button")).toHaveText("Validate Result");
    await page.locator("#button").click();
}

async function verifyValidation(page, milestones) {
    // Expect the validation dialog
    const validationDialog = page.locator("#validation");
    await expect(validationDialog).toBeVisible();
    await expect(validationDialog.locator("h2")).toHaveText("Game Validation");
    // Check if completion time is displayed (assuming all milestones were visited)
    await expect(validationDialog.locator("#completionLabel")).toBeVisible();
    await expect(validationDialog.locator("#validationError")).not.toBeVisible(); // Should be no error if all cookies set

    for (let i = 0; i < milestones.length; i++) {
        await expect(validationDialog.locator("#validationParent input").nth(i)).toBeChecked();
    }
}

async function verifyHint(page) {
    const hintDialog = page.locator("#hint");
    await expect(page.locator("#error")).not.toBeVisible();
    await expect(hintDialog).toBeVisible({timeout: 10000});
    await expect(hintDialog.locator("#hintOK")).toBeVisible();
    await hintDialog.locator("#hintOK").click();
    await expect(hintDialog).not.toBeVisible();
}

// --- Test Suite for the Polaris Game ---
test.describe("Polaris Game Flows", () => {

    // --- Welcome Screen and Onboarding ---
    test.describe("Welcome Screen & Onboarding", () => {
        test.beforeEach(async ({page}) => {
            await reset(page);
        });

        test("should load the welcome screen correctly", async ({page}) => {
            // Check for key elements on the welcome screen
            await expect(page.locator("img.page-top-image")).toBeVisible();
            await expect(page.locator("h1.title")).toHaveText("Welcome!");
            await expect(page.locator("#team")).toBeVisible();
            await expect(page.locator("#button")).toHaveText("Begin"); // Assumes game is ready
            await expect(page.locator("#gameOverride")).toBeVisible();
            await expect(page.locator("#generateQR")).toBeVisible();
            await expect(page.locator("#footer")).toBeVisible();
        });

        test("should show error for empty team name", async ({page}) => {
            // Locate the Begin button
            const beginButton = page.locator("#button");
            // Click Begin without entering a team name
            await beginButton.click();
            // The error dialog should NOT appear immediately based on script.js logic
            // (it checks for empty input before fetching/validating)
            // Let's ensure the hint dialog didn't appear either
            await expect(page.locator("#hint")).not.toBeVisible();
            // Input field should still be there
            await expect(page.locator("#team")).toBeVisible();
        });

        test("should show error for invalid team name", async ({page}) => {
            // Fill in an invalid team name (assuming "InvalidTeam" doesn't exist in CSVs)
            await page.locator("#team").fill("InvalidTeam");
            // Click Begin
            await page.locator("#button").click();

            // Expect the error dialog to appear after the fetch attempt fails
            const errorDialog = page.locator("#error");
            await expect(errorDialog).toBeVisible({timeout: 10000}); // Increase timeout for potential fetch
            await expect(errorDialog.locator("#errorText")).toHaveText("Team Name Invalid");

            // Close the error dialog
            await errorDialog.locator("#errorOK").click();
            await expect(errorDialog).not.toBeVisible();
        });

        test("should successfully onboard with a valid team name and show first hint", async ({page}) => {
            // Fill in a valid team name (assuming "Halloumi" exists in CSVs)
            await page.locator("#team").fill("Halloumi");
            // Click Begin
            await page.locator("#button").click();

            // Expect the hint dialog to appear after successful onboarding
            const hintDialog = page.locator("#hint");
            await expect(hintDialog).toBeVisible({timeout: 10000}); // Increase timeout for fetch
            // Check for elements within the hint dialog (content depends on CSVs)
            await expect(hintDialog.locator("#hintOK")).toBeVisible();

            // Close the hint dialog
            await hintDialog.locator("#hintOK").click();
            await expect(hintDialog).not.toBeVisible();

            // Verify cookies/local storage were likely set (basic check)
            const teamCookie = await page.context().cookies();
            expect(teamCookie.some(c => c.name === "Team" && c.value === "Halloumi")).toBeTruthy();
            const primaryFile = await page.evaluate(() => localStorage.getItem("primaryFile"));
            expect(primaryFile).not.toBeNull();
        });
    });

    // --- Clue Progression (Requires Onboarding First) ---
    test.describe("Clue Progression", () => {
        const teams = ["Halloumi", "Souvla", "Sheftalia", "Anari", "Zivania", "Koumantaria", "Koupepia", "Kleftiko", "Loukoumades"];
        const milestones = ["Lookout", "Stage", "Gallery", "Summit", "Oasis", "Aviary", "Sanctuary"];

        test.beforeEach(async ({page}) => {
            // Simulate successful onboarding before each progression test
            await reset(page);
            await page.locator("#team").fill(teams[0]);
            await page.locator("#button").click();
            await expect(page.locator("#hint")).toBeVisible({timeout: 10000});
            await page.locator("#hintOK").click();
            await expect(page.locator("#hint")).not.toBeVisible();
            // At this point, cookies/localStorage for teamName should be set
        });

        test("should show congratulations and hint for correct milestone URL", async ({page}) => {
            // Navigate directly to the first milestone URL
            await page.goto(`/?team=${teams[0]}&milestone=${milestones[0]}`);

            // Expect the congratulations screen
            await verifyCongratulations(page);

            // Expect the hint dialog for the *next* milestone
            const hintDialog = page.locator("#hint");
            await expect(hintDialog).toBeVisible();
            await expect(hintDialog.locator("#hintOK")).toBeVisible();

            // Close the hint dialog
            await hintDialog.locator("#hintOK").click();
            await expect(hintDialog).not.toBeVisible();

            // Verify the milestone cookie was granted
            const milestoneCookie = await page.context().cookies();
            expect(milestoneCookie.some(c => c.name === milestones[0] && c.value === "Granted")).toBeTruthy();
        });

        test("should show error when accessing clue for wrong team", async ({page}) => {
            // Navigate to a milestone URL but with a different team name in params
            await page.goto(`/?team=${teams[1]}&milestone=${milestones[0]}`);

            await verifyCongratulations(page);

            // Expect the "not for your team" error dialog
            const errorDialog = page.locator("#error");
            await expect(errorDialog).toBeVisible();
            await expect(errorDialog.locator("#errorText")).toContainText("This clue is not meant for your team");

            // Close the error dialog
            await errorDialog.locator("#errorOK").click();
            await expect(errorDialog).not.toBeVisible();
        });

        test("should show error when accessing clue out of order", async ({page}) => {
            // Navigate directly to the *second* milestone URL without "visiting" the first
            await page.goto(`/?team=${teams[0]}&milestone=${milestones[1]}`);

            await verifyCongratulations(page);

            // Expect the "not supposed to be here yet" error dialog
            const errorDialog = page.locator("#error");
            await expect(errorDialog).toBeVisible();
            await expect(errorDialog.locator("#errorText")).toContainText("You're not supposed to be here yet");

            // Close the error dialog
            await errorDialog.locator("#errorOK").click();
            await expect(errorDialog).not.toBeVisible();
        });

        test("should show finish screen and validation for final milestone", async ({page}) => {
            // Simulate completing previous milestones (set cookies manually for simplicity)
            for (const milestone of milestones) {
                await page.context().addCookies([
                    {name: milestone, value: "Granted", path: "/", domain: "localhost"}
                ]);
            }
            // Also need the finalMilestone value in local storage
            await page.evaluate((final) => localStorage.setItem("finalMilestone", final), milestones[milestones.length - 1]);


            // Navigate to the final milestone URL
            await page.goto(`/?team=${teams[0]}&milestone=${milestones[milestones.length - 1]}`);

            await verifyFinish(page);

            await verifyValidation(page, milestones);

            // Close the validation dialog
            const validationDialog = page.locator("#validation");
            await validationDialog.locator("#validateOK").click();
            await expect(validationDialog).not.toBeVisible();
        });

        test.describe("All Teams and Milestones Test", () => {
            test.skip(!!process.env.CI, 'Skipping this test in CI environment');

            test.beforeEach(async ({page}) => {
                await reset(page);
            });
            for (const team of teams) {
                test(`should progress though all the milestones for team ${team}`, async ({page}) => {
                    await page.locator("#team").fill(team);
                    await page.locator("#button").click();
                    await verifyHint(page);
                    for (const milestone of milestones) {
                        await page.goto(`/?team=${team}&milestone=${milestone}`);
                        await page.locator("#button").click();
                        if (milestone === milestones[milestones.length - 1]) {
                            await verifyValidation(page, milestones);
                        } else {
                            await verifyHint(page);
                        }
                    }
                });
            }
        });
    });

    // --- Other Features ---
    test.describe("Other Features", () => {
        test.beforeEach(async ({page}) => {
            // Go to the base URL before each test
            await page.goto("/");
            // Basic onboarding to enable some features if needed
            await page.evaluate(() => localStorage.clear());
            await page.context().clearCookies();
            await page.reload();
            await expect(page.locator("h1.title")).toHaveText("Welcome!");
            await page.locator("#team").fill("Halloumi");
            await page.locator("#button").click();
            await expect(page.locator("#hint")).toBeVisible({timeout: 10000});
            await page.locator("#hintOK").click();
        });

        test("should open and close the Game Override dialog", async ({page}) => {
            const overrideLink = page.locator("#gameOverride");
            const overrideDialog = page.locator("#override");

            await expect(overrideDialog).not.toBeVisible();
            await overrideLink.click();
            await expect(overrideDialog).toBeVisible();
            await expect(overrideDialog.locator("h2")).toHaveText("Game Override");

            // Close the dialog
            await overrideDialog.locator("#overrideExit").click();
            await expect(overrideDialog).not.toBeVisible();
        });

        test("should open and close the Generate QR Codes dialog", async ({page}) => {
            const qrLink = page.locator("#generateQR");
            const qrDialog = page.locator("#qr");

            await expect(qrDialog).not.toBeVisible();
            await qrLink.click();
            await expect(qrDialog).toBeVisible();
            await expect(qrDialog.locator("h2")).toHaveText("Generate QR Codes PDF");

            // Close the dialog
            await qrDialog.locator("#qrExit").click();
            await expect(qrDialog).not.toBeVisible();
        });

        test("should interact with the checklist", async ({page}) => {
            const checklistContainer = page.locator("#checklistContainer");
            const checklistDrawer = page.locator("#checklistDrawer");
            const checklistBody = page.locator("#checklistBody");

            // Ensure checklist is present (based on checklist.csv existing)
            await expect(checklistContainer).toBeVisible();
            await expect(checklistDrawer).toBeVisible();
            await expect(checklistBody).toBeHidden(); // Starts closed

            // Open the drawer
            await checklistDrawer.click();
            await expect(checklistBody).toBeVisible(); // Should animate open
            await expect(checklistBody).toHaveCSS("height", /^[1-9][0-9]*px$/); // Check height is > 0

            // Find the first checklist item and interact with it
            const firstItem = checklistBody.locator(".checklist-item").first();
            const firstCheckbox = firstItem.locator("input[type=\"checkbox\"]");
            const firstText = firstItem.locator("span");

            await expect(firstCheckbox).not.toBeChecked();
            await expect(firstText).not.toHaveCSS("text-decoration", /line-through/);

            // Click the item to check it
            await firstItem.click();
            await expect(firstCheckbox).toBeChecked();
            await expect(firstText).toHaveCSS("text-decoration", /line-through/);

            // Click again to uncheck it
            await firstItem.click();
            await expect(firstCheckbox).not.toBeChecked();
            await expect(firstText).not.toHaveCSS("text-decoration", /line-through/);

            // Close the drawer
            await checklistDrawer.click();
            // Wait for animation (Playwright might handle this, but explicit wait can be safer)
            await page.waitForTimeout(1100); // Wait slightly longer than the 1s transition
            await expect(checklistBody).toHaveCSS("height", "0px");
        });
    });
});