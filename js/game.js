import {generateQR} from "./qrGen";

const params = new URLSearchParams(window.location.search);

const error1 = "Error 1: The URL Arguments are invalid. Please contact the Game Organizer.";

/**
 * Parses a CSV string into a 2D array.
 * Handles quoted fields, escaped quotes, and various newline characters.
 * @param {string} file - The CSV string to parse.
 * @returns {string[][]} A 2D array representing the CSV data.
 * @throws {Error} If the file is invalid or malformed.
 */
export function parseCSV(file) {
    "use strict";
    if (file === null || typeof file !== "string") {
        throw new Error("Invalid file");
    }
    file = file.trim();
    if (file.length === 0) {
        throw new Error("Invalid file");
    }

    let insideQuotes = false;
    let lines = [];
    let records = [];
    let currentRecord = "";
    for (let i = 0; i < file.length; i++) {
        const char = file[i];
        const nextChar = (i + 1 < file.length) ? file[i + 1] : null;

        if (insideQuotes) {
            if (char === "\"") {
                if (nextChar === "\"") {
                    currentRecord += "{escaped-quote}";
                    i++;
                } else {
                    insideQuotes = false;
                }
            } else if (char === ",") {
                currentRecord += "{enclosed-comma}";
            } else if (char === "\r") {
                currentRecord += "{enclosed-newline}";
                if (nextChar === "\n") {
                    i++;
                }
            } else if (char === "\n") {
                currentRecord += "{enclosed-newline}";
            } else {
                currentRecord += char;
            }
        } else {
            if (char === "\"") {
                insideQuotes = true;
                if (nextChar === "\"") {
                    insideQuotes = false;
                    i++;
                }
            } else if (char === ",") {
                records.push(currentRecord);
                currentRecord = "";
            } else if (char === "\r") {
                records.push(currentRecord);
                lines.push(records);
                records = [];
                currentRecord = "";
                if (nextChar === "\n") {
                    i++;
                }
            } else if (char === "\n") {
                records.push(currentRecord);
                lines.push(records);
                records = [];
                currentRecord = "";
            } else {
                currentRecord += char;
            }
        }
    }

    if (currentRecord.trim() !== "" || records.length > 0) {
        records.push(currentRecord);
        lines.push(records);
    }

    let array = [];
    for (let i = 0; i < lines.length; i++) {
        const records = lines[i];
        let processedRow = [];
        for (let j = 0; j < records.length; j++) {
            let record = records[j].trim();
            if (record.includes("<script>")) {
                throw new Error("Invalid file");
            }
            record = record.replaceAll("{escaped-quote}", "\"");
            record = record.replaceAll("{enclosed-newline}", "\n");
            record = record.replaceAll("{enclosed-comma}", ",");
            processedRow.push(record);
        }
        array.push(processedRow);
    }

    if (array.length > 0) {
        const expectedLength = array[0].length;
        for (let i = 1; i < array.length; i++) {
            if (array[i].length !== expectedLength) {
                throw new Error("Invalid file");
            }
        }
    } else {
        throw new Error("Invalid file");
    }
    return array;
}

/**
 * Fetches and parses CSV data for a specific team.
 * @param {string} fileURL - The URL of the CSV file.
 * @param {string} teamName - The name of the team.
 * @returns {Promise<string[][]>} The parsed CSV data for the team.
 * @throws {Error} If the file is invalid, team not found, or network error.
 */
async function getTeamData(fileURL, teamName) {
    "use strict";
    let fileData;
    try {
        const response = await fetch(fileURL);
        if (!response.ok && response.headers.get("Content-Type") === "text/csv") {
            throw "";
        }
        fileData = await response.text();
    } catch (error) {
        throw new Error("Failed to get the specified file.");
    }

    let parsedCSV;
    try {
        parsedCSV = parseCSV(fileData);
    } catch (error) {
        throw error;
    }

    let array = [];
    for (let i = 0; i < parsedCSV.length; i++) {
        const row = parsedCSV[i];
        if (i === 0 || (row.length > 0 && row[0].trim() === teamName)) {
            array.push(row);
        }
        if (array.length === 2 && i > 0) {
            break;
        }
    }

    if (array.length === 2) {
        return array;
    } else {
        throw new Error("Team not found");
    }
}

/**
 * Executes a function when the DOM is fully loaded and parsed.
 * @param {function} fn - The function to execute.
 */
function docReady(fn) {
    "use strict";
    if (document.readyState === "complete") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

/**
 * Gets a cookie by name.
 * @param {string} cName - The name of the cookie.
 * @returns {string} The cookie value, or an empty string if not found.
 */
function getCookie(cName) {
    "use strict";
    const name = cName + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

/**
 * Sets a cookie.
 * @param {string} cName - The name of the cookie.
 * @param {string} cValue - The value of the cookie.
 * @param {number} exDays - The number of days until the cookie expires.
 */
function setCookie(cName, cValue, exDays) {
    "use strict";
    const d = new Date();
    d.setTime(d.getTime() + (exDays * 24 * 60 * 60 * 1000));
    const expires = "expires=" + d.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

// Event listeners setup
docReady(() => {
    "use strict";
    document.getElementById("gameOverride").addEventListener("click", () => {
        renderOverride();
    });
    document.getElementById("overrideOK").addEventListener("click", () => {
        override();
    });
    document.getElementById("generateQR").addEventListener("click", () => {
        renderQR();
    });
    document.getElementById("qrExit").addEventListener("click", () => {
        document.getElementById("qr").close();
    });
    document.getElementById("overrideExit").addEventListener("click", () => {
        document.getElementById("override").close();
    });
    document.getElementById("validateOK").addEventListener("click", () => {
        document.getElementById("validation").close();
    });
    document.getElementById("hintOK").addEventListener("click", () => {
        document.getElementById("hint").close();
    });
    document.getElementById("errorOK").addEventListener("click", () => {
        document.getElementById("error").close();
    });
    document.getElementById("csvUpload").addEventListener("click", () => {
        document.getElementById("csvFile").click();
    });
    let csvFile;
    document.getElementById("csvFile").addEventListener("change", (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.addEventListener("load", (e) => {
            csvFile = e.target.result;
        });
        if (file !== null) {
            reader.readAsText(file);
        }
    });
    document.getElementById("qrGenerate").addEventListener("click", async function () {
        await generateQR(csvFile);
    });
});

/**
 * Renders the welcome screen.
 * @param {string} gameName - The name of the game.
 * @param {boolean} isTeamless - True if the game is teamless, false otherwise.
 */
function renderWelcome(gameName, isTeamless) {
    "use strict";
    document.title = "Welcome | Polaris";
    document.getElementById("logo").style.display = "block";
    document.getElementById("icon").style.display = "none";
    document.getElementById("title").innerHTML = "Welcome!";
    document.getElementById("description").innerHTML = "We would like to welcome you to the";
    document.getElementById("gameName").style.display = "block";
    document.getElementById("gameName").innerHTML = gameName;
    document.getElementById("button").onclick = null;
    if (isTeamless) {
        document.getElementById("team").style.display = "none";
        document.getElementById("button").addEventListener("click", () => {
            handleOnboarding(isTeamless);
        });
    } else {
        document.getElementById("team").style.display = "block";
        document.getElementById("button").addEventListener("click", () => {
            handleOnboarding(isTeamless);
        });
    }
    document.getElementById("button").innerHTML = "Begin";
    document.getElementById("loading").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
    }, 1000);
}

/**
 * Renders the congratulations screen when a milestone is reached.
 */
function renderCongratulations() {
    "use strict";
    document.title = "Found Hint | Polaris";
    document.getElementById("logo").style.display = "none";
    document.getElementById("icon").style.display = "block";
    document.getElementById("icon").innerHTML = "celebration";
    document.getElementById("title").innerHTML = "Congratulations!";
    document.getElementById("description").innerHTML = "You have at arrived at your next clue.<br>Please click the button below to see your clue.";
    document.getElementById("gameName").style.display = "none";
    document.getElementById("team").style.display = "none";
    document.getElementById("button").innerHTML = "View Hint";
    document.getElementById("button").onclick = null;
    document.getElementById("button").addEventListener("click", () => {
        handleHint();
    });
    document.getElementById("loading").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
    }, 1000);
}

/**
 * Renders the finish screen when the game is completed.
 */
function renderFinish() {
    "use strict";
    document.title = "Validation | Polaris";
    document.getElementById("logo").style.display = "none";
    document.getElementById("icon").style.display = "block";
    document.getElementById("icon").innerHTML = "social_leaderboard";
    document.getElementById("title").innerHTML = "Congratulations!";
    document.getElementById("description").innerHTML = "You have finished the game.<br>Please submit your score after clicking validate.";
    document.getElementById("gameName").style.display = "none";
    document.getElementById("team").style.display = "none";
    document.getElementById("button").innerHTML = "Validate Result";
    document.getElementById("button").onclick = null;
    document.getElementById("button").addEventListener("click", () => {
        handleValidate();
    });
    document.getElementById("loading").style.opacity = "0";
    setTimeout(() => {
        document.getElementById("loading").style.display = "none";
    }, 1000);
}

/**
 * Determines the primary game file based on enabled features.
 * @param {object} enabledFeatures - An object indicating available game files.
 * @returns {string} The name of the primary file (e.g., "textHints") or null if none.
 * @throws {Error} When no primary file is found.
 */
function getPrimaryFile(enabledFeatures) {
    "use strict";
    if (enabledFeatures.th) {
        return "textHints";
    } else if (enabledFeatures.ih) {
        return "imageHints";
    } else if (enabledFeatures.tc) {
        return "textChallenges";
    } else {
        throw new Error("No valid CSV files are present.");
    }
}

/**
 * Gets the base URL of the current application.
 * Strips query parameters, trailing slashes, and "index.html".
 * @returns {string} The cleaned base URL.
 */
function getBaseURL() {
    "use strict";
    let baseURL = window.location.href;
    if (baseURL.includes("?")) {
        baseURL = baseURL.slice(0, baseURL.indexOf("?"));
    }
    if (baseURL[baseURL.length - 1] === "/") {
        baseURL = baseURL.slice(0, -1);
    }
    if (baseURL.slice(baseURL.length - 11) === "/index.html") {
        baseURL = baseURL.slice(0, baseURL.length - 11);
    }
    return baseURL;
}

/**
 * Performs a quick check for the existence and correct MIME type of game asset files.
 * @param {string} baseURL - The base URL where assets are located.
 * @returns {Promise<object>} A promise that resolves to an object indicating which features (files) are available.
 * Example: { th: true, ih: false, tc: true, cl: true, lg: true, fv: false }
 */
async function quickFeatureCheck(baseURL) {
    "use strict";

    /**
     * @returns {Promise<boolean>}
     */
    async function checkFile(filename, mimetype) {
        try {
            const response = await fetch(baseURL + "/assets/game/" + filename, {method: "HEAD"});
            return response.ok && response.headers.get("Content-Type")?.includes(mimetype);
        } catch (error) {
            window.console.warn("Network Error while checking for " + filename, error);
            return false;
        }
    }

    return {
        th: await checkFile("textHints.csv", "text/csv"),
        ih: await checkFile("imageHints.csv", "text/csv"),
        tc: await checkFile("textChallenges.csv", "text/csv"),
        cl: await checkFile("checklist.csv", "text/csv"),
        lg: await checkFile("logo.svg", "image/svg+xml"),
        fv: await checkFile("favicon.svg", "image/svg+xml"),
    };
}

// Main application logic initialization
docReady(async () => {
    "use strict";

    const createdTimestamp = localStorage.getItem("createdTimestamp");
    if (createdTimestamp && Date.now() - parseInt(createdTimestamp, 10) > 86400000) {
        localStorage.clear();
    }

    let baseURL = localStorage.getItem("baseURL");
    if (!baseURL) {
        baseURL = getBaseURL();
        localStorage.setItem("baseURL", baseURL);
    }

    if (!localStorage.getItem("enabledFeatures") || !localStorage.getItem("primaryFile")) {
        let enabledFeatures;
        try {
            enabledFeatures = await quickFeatureCheck(baseURL);
            const primaryFile = getPrimaryFile(enabledFeatures);
            localStorage.setItem("primaryFile", primaryFile);
            localStorage.setItem("enabledFeatures", JSON.stringify(enabledFeatures));
        } catch (e) {
            document.getElementsByClassName("page-top-image")[0].src = baseURL + "/assets/polarisLogo.svg";
            document.querySelector("link[rel~='icon']").href = baseURL + "/assets/polarisLogo.svg";
            renderWelcome("Polaris Game", false);
            document.getElementById("button").innerHTML = "GAME NOT READY";
            document.getElementById("button").disabled = true;
            return;
        }
    }

    const enabledFeatures = JSON.parse(localStorage.getItem("enabledFeatures"));

    const logo = document.getElementsByClassName("page-top-image")[0];
    if (enabledFeatures.lg) {
        logo.src = baseURL + "/assets/game/logo.svg";
    } else {
        logo.src = baseURL + "/assets/polarisLogo.svg";
        window.console.warn("A game logo was not included.");
    }

    const favicon = document.querySelector("link[rel~='icon']");
    if (enabledFeatures.fv) {
        favicon.href = baseURL + "/assets/game/favicon.svg";
    } else {
        favicon.href = baseURL + "/assets/polarisLogo.svg";
        window.console.warn("A favicon was not included.");
    }

    if (enabledFeatures.cl) {
        let checklist = localStorage.getItem("checklist");
        if (!checklist) {
            const checklist = [];
            const lines = (await (await fetch(baseURL + "/assets/game/checklist.csv")).text()).split("\n");
            for (let i = 0; i < lines.length; i++) {
                checklist.push({
                    id: i,
                    checked: false,
                    text: lines[i],
                });
            }
            localStorage.setItem("checklist", JSON.stringify(checklist));
        }
        checklist = localStorage.getItem("checklist");
        const checklistItems = JSON.parse(checklist);
        renderChecklist(checklistItems);
    } else {
        document.getElementById("checklistContainer").style.display = "none";
    }

    if ((params.get("team") === null && params.get("milestone") === null) || getCookie("Team").trim() === "") {
        const primaryFileText = await (await fetch(baseURL + "/assets/game/" + localStorage.getItem("primaryFile") + ".csv")).text();
        const primaryFileData = parseCSV(primaryFileText);
        renderWelcome(primaryFileData[0][0], (primaryFileData[1][0] === "Teamless" && primaryFileData.length === 2));
        return;
    }

    if (params.get("milestone") === localStorage.getItem("finalMilestone")) {
        renderFinish();
    } else {
        renderCongratulations();
    }
});

/**
 * Renders the checklist in the UI.
 * @param {Array<object>} checklistItems - An array of checklist item objects.
 * Each object should have `id`, `checked` (boolean), and `text` properties.
 */
function renderChecklist(checklistItems) {
    "use strict";
    if (checklistItems.length === 0) {
        document.getElementById("checklistContainer").style.display = "none";
        return;
    }
    let height = 0;
    for (const item of checklistItems) {
        const container = document.createElement("div");
        container.classList.add("checklist-item");
        container.addEventListener("click", (e) => {
            const checkElement = e.currentTarget.getElementsByTagName("input")[0];
            const textElement = e.currentTarget.getElementsByTagName("span")[0];
            if (checkElement.checked) {
                textElement.style.textDecoration = "none";
                textElement.style.color = "black";
                checkElement.checked = false;
            } else {
                textElement.style.textDecoration = "line-through";
                textElement.style.color = "gray";
                checkElement.checked = true;
            }
            const list = JSON.parse(localStorage.getItem("checklist"));
            list[list.indexOf(list.find((lookup) => lookup.id === item.id))].checked = checkElement.checked;
            localStorage.setItem("checklist", JSON.stringify(list));
        });
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        if (item.checked) {
            checkbox.checked = true;
        }
        container.appendChild(checkbox);
        const text = document.createElement("span");
        text.innerHTML = item.text;
        if (item.checked) {
            text.style.textDecoration = "line-through";
            text.style.color = "gray";
        }
        container.appendChild(text);
        document.getElementById("checklistBody").appendChild(container);
    }
    for (const child of document.getElementById("checklistBody").children) {
        height += child.offsetHeight + Number(getComputedStyle(child).marginTop.slice(0, -2)) + Number(getComputedStyle(child).marginBottom.slice(0, -2));
    }

    let drawerOpen = false;
    document.getElementById("checklistDrawer").addEventListener("click", () => {
        if (drawerOpen) {
            document.getElementById("checklistBody").style.height = "0";
            document.getElementById("checklistBody").style.border = "none";
            drawerOpen = false;
        } else {
            document.getElementById("checklistBody").style.height = Math.min(height, 600) + "px";
            document.getElementById("checklistBody").style.border = "1px solid #e6e6e6";
            drawerOpen = true;
        }
    });
    document.getElementById("checklistContainer").style.display = "block";
}

/**
 * Reorders game data based on a provided order array.
 * @param {string[][]} gameData - The game data (milestones in row 0, values in row 1).
 * @param {number[]} order - An array of indices for reordering.
 * @returns {string[][]} The reordered game data.
 */
function reorderGameData(gameData, order) {
    "use strict";
    const newData = window.structuredClone(gameData);
    for (let i = 1; i < gameData[0].length; i++) {
        newData[0][i] = gameData[0][order[i - 1]];
        newData[1][i] = gameData[1][order[i - 1]];
    }
    return newData;
}

/**
 * Logic for player/team onboarding. Fetches data, validates, and sets up initial state.
 * @param {string} inputTeam - The team name entered by the user.
 * @param {boolean} isTeamless
 * @returns {Promise<{textHint: string | null, imageHint: string | null, textChallenge: string | null}>} Hint data for the first milestone ({textHint, imageHint, textChallenge}).
 * @throws {Error} If onboarding fails (e.g., team not found, data mismatch).
 */
async function onboarding(inputTeam, isTeamless) {
    "use strict";
    const enabledFeatures = JSON.parse(localStorage.getItem("enabledFeatures"));
    const baseURL = localStorage.getItem("baseURL");

    if (!isTeamless && (!inputTeam || inputTeam.trim() === "")) {
        throw new Error("Please enter a team team.");
    }

    const values = new Map();
    if (enabledFeatures.th) {
        try {
            const textHints = await getTeamData(baseURL + "/assets/game/textHints.csv", inputTeam);
            values.set("textHints", textHints);
        } catch (error) {
            switch (error.message) {
                case "Invalid file":
                    enabledFeatures.th = false;
                    window.console.warn("The file textHints.csv is invalid.");
                    break;
                case "Failed to get the specified file.":
                    enabledFeatures.th = false;
                    window.console.warn("Failed to retrieve textHints.csv.");
                    break;
                case "Team not found":
                    throw new Error("The given team name is invalid.");
            }
        }
    }
    if (enabledFeatures.ih) {
        try {
            const imageHints = await getTeamData(baseURL + "/assets/game/imageHints.csv", inputTeam);
            values.set("imageHints", imageHints);
        } catch (error) {
            switch (error.message) {
                case "Invalid file":
                    enabledFeatures.ih = false;
                    window.console.warn("The file imageHints.csv is invalid.");
                    break;
                case "Failed to get the specified file.":
                    enabledFeatures.th = false;
                    window.console.warn("Failed to retrieve textHints.csv.");
                    break;
                case "Team not found":
                    throw new Error("The given team name is invalid.");
            }
        }
    }
    if (enabledFeatures.tc) {
        try {
            const textChallenges = await getTeamData(baseURL + "/assets/game/textChallenges.csv", inputTeam);
            values.set("textChallenges", textChallenges);
        } catch (error) {
            switch (error.message) {
                case "Invalid file":
                    enabledFeatures.tc = false;
                    window.console.warn("The file textChallenges.csv is invalid.");
                    break;
                case "Failed to get the specified file.":
                    enabledFeatures.th = false;
                    window.console.warn("Failed to retrieve textHints.csv.");
                    break;
                case "Team not found":
                    throw new Error("The given team name is invalid.");
            }
        }
    }

    localStorage.setItem("enabledFeatures", JSON.stringify(enabledFeatures));

    let primaryFile;
    try {
        primaryFile = getPrimaryFile(enabledFeatures);
    } catch (error) {
        throw error;
    }

    const primaryFileData = values.get(primaryFile);

    let mismatch = false;
    if (enabledFeatures.th && JSON.stringify(values.get("textHints")[0]) !== JSON.stringify(primaryFileData[0])) {
        mismatch = true;
    }
    if (enabledFeatures.ih && JSON.stringify(values.get("imageHints")[0]) !== JSON.stringify(primaryFileData[0])) {
        mismatch = true;
    }
    if (enabledFeatures.tc && JSON.stringify(values.get("textChallenges")[0]) !== JSON.stringify(primaryFileData[0])) {
        mismatch = true;
    }
    if (mismatch) {
        throw new Error("The CSV files have mismatched Milestones or a mismatched name.");
    }

    const order = [];
    if (isTeamless) {
        for (let i = 1; i < primaryFileData[0].length; i++) {
            order.push(i);
        }
        let currentIndex = order.length;
        let randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            [order[currentIndex], order[randomIndex]] = [order[randomIndex], order[currentIndex]];
        }
    }

    let textHint = null, imageHint = null, textChallenge = null;
    if (enabledFeatures.th) {
        if (isTeamless) {
            values.set("textHints", reorderGameData(values.get("textHints"), order));
        }
        localStorage.setItem("textHints", JSON.stringify(values.get("textHints")));
        textHint = values.get("textHints")[1][1];
    }
    if (enabledFeatures.ih) {
        if (isTeamless) {
            values.set("imageHints", reorderGameData(values.get("imageHints"), order));
        }
        localStorage.setItem("imageHints", JSON.stringify(values.get("imageHints")));
        imageHint = values.get("imageHints")[1][1];
    }
    if (enabledFeatures.tc) {
        if (isTeamless) {
            values.set("textChallenges", reorderGameData(values.get("textChallenges"), order));
        }
        localStorage.setItem("textChallenges", JSON.stringify(values.get("textChallenges")));
        textChallenge = values.get("textChallenges")[1][1];
    }

    localStorage.setItem("primaryFile", primaryFile);
    localStorage.setItem("createdTimestamp", String(Date.now()));
    localStorage.setItem("finalMilestone", primaryFileData[0][primaryFileData[0].length - 1]);

    setCookie("Team", primaryFileData[1][0], 1);
    return {textHint, imageHint, textChallenge};
}

/**
 * Handles the UI interaction for onboarding. Calls the `onboarding` logic
 * and renders the first hint or an error message.
 * @param {boolean} isTeamless - True if the game is teamless.
 */
async function handleOnboarding(isTeamless) {
    "use strict";
    try {
        const {
            textHint,
            imageHint,
            textChallenge
        } = await onboarding(document.getElementById("team").value, isTeamless);
        renderHint(textHint, imageHint, textChallenge);
    } catch (error) {
        document.getElementById("errorText").innerHTML = error.message;
        document.getElementById("error").showModal();
    }
}

/**
 * Calculates and retrieves the hint for the current milestone based on URL parameters and game state.
 * Validates team and milestone progression.
 * @returns {{textHint: string | null, imageHint: string | null, textChallenge: string | null}}
 * An object containing hint data for the current milestone.
 * Properties are null if the feature is not enabled or no hint exists for the next step.
 * @throws {Error} If validation fails (e.g., wrong team, milestone out of order, invalid params)
 * or if hint data cannot be retrieved.
 */
function calculateHint() {
    "use strict";
    if (getCookie("Team") !== params.get("team")) {
        throw new Error("This clue is not meant for your team.<br>Keep looking.");
    }

    const enabledFeatures = JSON.parse(localStorage.getItem("enabledFeatures"));
    const primaryFile = localStorage.getItem("primaryFile");

    const values = new Map();
    if (enabledFeatures.th) {
        const textHints = JSON.parse(localStorage.getItem("textHints"));
        values.set("textHints", textHints);
    }
    if (enabledFeatures.ih) {
        const imageHints = JSON.parse(localStorage.getItem("imageHints"));
        values.set("imageHints", imageHints);
    }
    if (enabledFeatures.tc) {
        const textChallenges = JSON.parse(localStorage.getItem("textChallenges"));
        values.set("textChallenges", textChallenges);
    }

    const milestones = values.get(primaryFile)[0].slice(1);
    if (!milestones.includes(params.get("milestone"))) {
        throw new Error(error1);
    }
    const currentMilestone = milestones.indexOf(params.get("milestone"));
    for (let i = 0; i < currentMilestone; i++) {
        if (getCookie(milestones[i]) !== "Granted") {
            throw new Error("You're not supposed to be here yet. Keep looking for previous clues.");
        }
    }
    setCookie(milestones[currentMilestone], "Granted", 1);
    let textHint;
    if (enabledFeatures.th) {
        textHint = values.get("textHints")[1][currentMilestone + 2];
    } else {
        textHint = null;
    }
    let imageHint;
    if (enabledFeatures.ih) {
        imageHint = values.get("imageHints")[1][currentMilestone + 2];
    } else {
        imageHint = null;
    }
    let textChallenge;
    if (enabledFeatures.tc) {
        textChallenge = values.get("textChallenges")[1][currentMilestone + 2];
    } else {
        textChallenge = null;
    }
    return {textHint, imageHint, textChallenge};
}

/**
 * Renders the hint dialog with the provided text, image, and/or challenge.
 * @param {string | null} text - The text hint. Null if not applicable.
 * @param {string | null} image - The URL or data URI for the image hint. Null if not applicable.
 * @param {string | null} challenge - The text challenge. Null if not applicable.
 */
function renderHint(text, image, challenge) {
    "use strict";
    let hintPresent = false;
    let challengePresent = false;

    if (text !== null && text.toLowerCase() !== "null" && text.trim() !== "") {
        document.getElementById("hintContainer").style.display = "flex";
        document.getElementById("hintText").innerHTML = text;
        hintPresent = true;
    }
    if (image !== null && image.toLowerCase() !== "null" && image.trim() !== "") {
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").src = image;
        hintPresent = true;
    }
    if (challenge !== null && challenge.toLowerCase() !== "null" && challenge.trim() !== "") {
        document.getElementById("challengeContainer").style.display = "flex";
        document.getElementById("challengeText").innerHTML = challenge;
        challengePresent = true;
    }
    if (hintPresent && challengePresent) {
        document.getElementById("hintDivider").style.display = "block";
    } else {
        document.getElementById("hintDivider").style.display = "none";
    }
    document.getElementById("hint").showModal();
}

/**
 * Handles the UI interaction for displaying a hint. Calls `calculateHint`
 * and then `renderHint` or shows an error.
 */
function handleHint() {
    "use strict";
    try {
        const {textHint, imageHint, textChallenge} = calculateHint();
        renderHint(textHint, imageHint, textChallenge);
    } catch (error) {
        document.getElementById("errorText").innerHTML = error.message;
        document.getElementById("error").showModal();
    }
}

/**
 * Logic for validating game completion.
 * @returns {{formatedTime: string, isCompleted: boolean[]}}
 * An object containing:
 * - `formatedTime`: The completion time as HH:MM:SS.
 * - `isCompleted`: An array of booleans indicating if each milestone was granted.
 * @throws {Error} If validation fails.
 */
function calculateValidate() {
    "use strict";
    if (getCookie("Team") !== params.get("team")) {
        throw new Error("This is not your team's finishing point.<br>Keep looking.");
    }

    let d = new Date();
    let h = String(d.getHours()).padStart(2, "0");
    let m = String(d.getMinutes()).padStart(2, "0");
    let s = String(d.getSeconds()).padStart(2, "0");
    const formatedTime = h + ":" + m + ":" + s;

    const primaryFileData = JSON.parse(localStorage.getItem(localStorage.getItem("primaryFile")));
    const milestones = primaryFileData[0].slice(1);

    setCookie(milestones[milestones.length - 1], "Granted", 1);

    const isCompleted = [];
    for (let i = 0; i < milestones.length; i++) {
        isCompleted.push(getCookie(milestones[i]) === "Granted");
    }

    return {formatedTime, isCompleted};
}

/**
 * Renders the validation dialog with completion time and milestone status.
 * @param {string} time - The formatted completion time (HH:MM:SS).
 * @param {Array<boolean>} isCompleted - Array indicating if each milestone was completed.
 */
function renderValidate(time, isCompleted) {
    "use strict";
    let completionCounter = isCompleted.length;

    document.getElementById("validationParent").innerHTML = "";
    for (let i = 0; i < isCompleted.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "10px";
        label.innerHTML = "Milestone " + (i + 1) + ":";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("validate-checkbox");
        checkbox.onclick = () => {
            return false;
        };
        if (isCompleted[i]) {
            completionCounter--;
            checkbox.checked = true;
        } else {
            label.style.color = "gray";
            checkbox.checked = false;
        }

        label.appendChild(checkbox);
        document.getElementById("validationParent").appendChild(label);
    }
    if (completionCounter > 0) {
        document.getElementById("completionLabel").style.display = "none";
        document.getElementById("validationError").innerHTML = "You haven't found all the clues";
        document.getElementById("validationError").style.display = "inline";
    }
    document.getElementById("completionTime").innerHTML = time;
    document.getElementById("validation").showModal();
}

/**
 * Handles the UI interaction for game validation. Calls `calculateValidate`
 * and then `renderValidate` or shows an error.
 */
function handleValidate() {
    "use strict";
    try {
        const {formatedTime, isCompleted} = calculateValidate();
        renderValidate(formatedTime, isCompleted);
    } catch (error) {
        document.getElementById("errorText").innerHTML = error.message;
        document.getElementById("error").showModal();
    }
}

/**
 * Renders the game override dialog, populating it with input fields for each milestone.
 * This allows manual setting of team name and milestone completion status (via cookies).
 */
function renderOverride() {
    "use strict";
    if (document.getElementById("overrideParent").getElementsByTagName("input").length > 1) {
        document.getElementById("override").showModal();
        return;
    }

    const primaryFileData = JSON.parse(localStorage.getItem(localStorage.getItem("primaryFile")));
    const milestones = primaryFileData[0];

    for (let i = 1; i < milestones.length; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.id = "overrideMilestone" + i;
        input.placeholder = "Milestone " + i;
        input.classList.add("dialog-input");
        document.getElementById("overrideParent").appendChild(input);
    }
    document.getElementById("override").showModal();
}

/**
 * Applies the override settings from the override dialog.
 * Sets the team cookie and grants milestone cookies based on user input.
 * Then closes the dialog.
 */
function override() {
    "use strict";
    const primaryFileData = JSON.parse(localStorage.getItem(localStorage.getItem("primaryFile")));
    const milestones = primaryFileData[0];
    let overrideTeam = document.getElementById("overrideTeam").value;
    if (overrideTeam.trim() !== "") {
        setCookie("Team", overrideTeam, 10);
    }
    for (let i = 1; i < milestones.length; i++) {
        if (document.getElementById("overrideMilestone" + i).value.trim() !== "") {
            setCookie(document.getElementById("overrideMilestone" + i).value, "Granted", 1);
        }
    }
    document.getElementById("override").close();
}

/**
 * Renders the QR code generation dialog.
 * Resets the progress bar width.
 */
function renderQR() {
    "use strict";
    document.getElementById("progressBar").style.width = "0px";
    document.getElementById("qr").showModal();
}