import {generateQR} from "./qrGen";

const params = new URLSearchParams(window.location.search);

const error1 = "Error 1: The URL Arguments are missing or wrong. Please contact the Game Organizer.";
const error2 = "Error 2: The website Cookies are missing or wrong. Please contact the Game Organizer.";

export function parseCSV(file) {
    "use strict";
    if (file === null || typeof file !== 'string') {
        throw "Invalid file";
    }
    file = file.trim();

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

    if (currentRecord !== "" || records.length > 0) {
        records.push(currentRecord);
        lines.push(records);
    }

    let array = [];
    for (let i = 0; i < lines.length; i++) {
        const records = lines[i];
        let processedRow = [];
        for (let j = 0; j < records.length; j++) {
            let record = records[j].trim();
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
                throw `Invalid file`;
            }
        }
    } else {
        throw "Invalid file";
    }
    return array;
}

function getTeamData(fileCSV, teamName) {
    "use strict";

    let parsedCSV;
    try {
        parsedCSV = parseCSV(fileCSV);
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
        throw "Team not found";
    }
}

function docReady(fn) {
    "use strict";
    if (document.readyState === "complete") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function getCookie(cName) {
    "use strict";
    let name = cName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(";");
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

function setCookie(cName, cValue, exDays) {
    "use strict";
    const d = new Date();
    d.setTime(d.getTime() + (exDays * 86400000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

docReady(async () => {
    "use strict";
    if (Date.now() - localStorage.getItem("createdTimestamp") > 86400000) {
        localStorage.clear();
    }

    document.getElementById("gameOverride").addEventListener("click", renderOverride);
    document.getElementById("overrideOK").addEventListener("click", override);
    document.getElementById("generateQR").addEventListener("click", renderQR);
    document.getElementById("qrExit").addEventListener("click", closeDialogs);
    document.getElementById("overrideExit").addEventListener("click", closeDialogs);
    document.getElementById("validateOK").addEventListener("click", closeDialogs);
    document.getElementById("hintOK").addEventListener("click", closeDialogs);
    document.getElementById("errorOK").addEventListener("click", closeDialogs);
    document.getElementById("csvUpload").addEventListener("click", () => {
        document.getElementById('csvFile').click();
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

function renderWelcome(gameName) {
    "use strict";
    document.title = "Welcome | Polaris";
    document.getElementById("logo").style.display = "block";
    document.getElementById("icon").style.display = "none";
    document.getElementById("title").innerHTML = "Welcome!";
    document.getElementById("description").innerHTML = "We would like to welcome you to the";
    document.getElementById("gameName").style.display = "block";
    document.getElementById("gameName").innerHTML = gameName;
    document.getElementById("team").style.display = "block";
    document.getElementById("page").style.display = "flex";
    document.getElementById("button").innerHTML = "Begin";
    document.getElementById("button").addEventListener("click", onboarding);
}

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
    document.getElementById("page").style.display = "flex";
    document.getElementById("button").innerHTML = "View Hint";
    document.getElementById("button").addEventListener("click", hint);
}

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
    document.getElementById("page").style.display = "flex";
    document.getElementById("button").innerHTML = "Validate Result";
    document.getElementById("button").addEventListener("click", validate);
}

docReady(async () => {
    "use strict";
    let baseURL;
    if (params.size === 0) {
        baseURL = window.location.href;
        if (baseURL[baseURL.length - 1] === "/") {
            baseURL = baseURL.slice(0, -1);
        }
        localStorage.setItem("baseURL", baseURL);
    } else {
        baseURL = localStorage.getItem("baseURL");
        if (!baseURL) {
            baseURL = window.location.origin;
            if (baseURL[baseURL.length - 1] === "/") {
                baseURL = baseURL.slice(0, -1);
            }
            localStorage.setItem("baseURL", baseURL);
        }
    }

    try {
        const logoRequest = await fetch(baseURL + "/assets/game/logo.svg", {method: "HEAD"});
        if (!logoRequest.ok || !logoRequest.headers.get("Content-Type").includes("image")) {
            document.getElementsByClassName("page-top-image")[0].src = baseURL + "/assets/polarisLogo.svg";
        }
    } catch (_) {
        document.getElementsByClassName("page-top-image")[0].src = baseURL + "/assets/polarisLogo.svg";
        window.console.warn("A game logo was not included.");
    }
    try {
        const faviconRequest = await fetch(baseURL + "/assets/game/favicon.svg", {method: "HEAD"});
        if (!faviconRequest.ok || !faviconRequest.headers.get("Content-Type").includes("image")) {
            const link = document.querySelector("link[rel~='icon']");
            link.href = baseURL + "/assets/polarisLogo.svg";
        }
    } catch (_) {
        const link = document.querySelector("link[rel~='icon']");
        link.href = baseURL + "/assets/polarisLogo.svg";
        window.console.warn("A favicon was not included.");
    }

    if (!localStorage.getItem("enabledFeatures") || !localStorage.getItem("primaryFile")) {
        const textHintsRequest = await fetch(baseURL + "/assets/game/textHints.csv", {method: "HEAD"});
        const imageHintsRequest = await fetch(baseURL + "/assets/game/imageHints.csv", {method: "HEAD"});
        const textChallengesRequest = await fetch(baseURL + "/assets/game/textChallenges.csv", {method: "HEAD"});
        const checklistRequest = await fetch(baseURL + "/assets/game/checklist.csv", {method: "HEAD"});
        const enabledFeatures = {
            th: textHintsRequest.ok && textHintsRequest.headers.get("Content-Type").includes("text/csv"),
            ih: imageHintsRequest.ok && imageHintsRequest.headers.get("Content-Type").includes("text/csv"),
            tc: textChallengesRequest.ok && textChallengesRequest.headers.get("Content-Type").includes("text/csv"),
            cl: checklistRequest.ok && checklistRequest.headers.get("Content-Type").includes("text/csv")
        };

        if (enabledFeatures.th || enabledFeatures.ih || enabledFeatures.tc) {
            let primaryFile = "";
            if (enabledFeatures.th) {
                primaryFile = "textHints";
            } else if (enabledFeatures.ih) {
                primaryFile = "imageHints";
            } else if (enabledFeatures.tc) {
                primaryFile = "textChallenges";
            }
            localStorage.setItem("primaryFile", primaryFile);
            localStorage.setItem("enabledFeatures", JSON.stringify(enabledFeatures));
        } else {
            renderWelcome("Polaris Game");
            document.getElementById("button").innerHTML = "GAME NOT READY";
            return;
        }
    }

    if (JSON.parse(localStorage.getItem("enabledFeatures")).cl) {
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
    } else {
        document.getElementById("checklistContainer").style.display = "none";
    }

    if (params.get("team") === null && params.get("milestone") === null) {
        const primaryFileData = await (await fetch(baseURL + "/assets/game/" + localStorage.getItem("primaryFile") + ".csv")).text();
        renderWelcome(parseCSV(primaryFileData)[0][0]);
        return;
    }

    const team = getCookie("Team");
    if (team === "") {
        window.alert(error2);
        document.location.href = "../index.html";
        return;
    }
    if (params.get("team") === null || params.get("milestone") === null) {
        window.alert(error1);
        document.location.href = "../index.html";
        return;
    }

    const finalMilestone = localStorage.getItem("finalMilestone");
    if (params.get("team") === team && params.get("milestone") === finalMilestone) {
        renderFinish();
    } else {
        renderCongratulations();
    }
});

function renderHint(text, image, challenge) {
    "use strict";
    let hintPresent = false;
    let challengePresent = false;
    if (text !== "NULL" && text !== "") {
        document.getElementById("hintContainer").style.display = "flex";
        document.getElementById("hintText").innerHTML = text;
        hintPresent = true;
    }
    if (image !== "NULL" && image !== "") {
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").src = image;
        hintPresent = true;
    }
    if (challenge !== "NULL" && challenge !== "") {
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

async function onboarding() {
    "use strict";
    const enabledFeatures = JSON.parse(localStorage.getItem("enabledFeatures"));
    const baseURL = localStorage.getItem("baseURL");

    let inputTeam = document.getElementById("team").value;
    if (inputTeam === "") {
        return;
    }

    const values = new Map();
    if (enabledFeatures.th) {
        try {
            const textHints = getTeamData(await (await fetch(baseURL + "/assets/game/textHints.csv")).text(), inputTeam);
            values.set("textHints", textHints);
            localStorage.setItem("textHints", JSON.stringify(textHints));
        } catch (error) {
            switch (error) {
                case "Invalid file":
                    enabledFeatures.th = false;
                    window.console.warn("The file textHints.csv is invalid.");
                    break;
                case "Team not found":
                    document.getElementById("errorText").innerHTML = "Team Name Invalid";
                    document.getElementById("error").showModal();
                    return;
            }
        }
    }
    if (enabledFeatures.ih) {
        try {
            const imageHints = getTeamData(await (await fetch(baseURL + "/assets/game/imageHints.csv")).text(), inputTeam);
            values.set("imageHints", imageHints);
            localStorage.setItem("imageHints", JSON.stringify(imageHints));
        } catch (error) {
            switch (error) {
                case "Invalid file":
                    enabledFeatures.ih = false;
                    window.console.warn("The file imageHints.csv is invalid.");
                    break;
                case "Team not found":
                    document.getElementById("errorText").innerHTML = "Team Name Invalid";
                    document.getElementById("error").showModal();
                    return;
            }
        }
    }
    if (enabledFeatures.tc) {
        try {
            const textChallenges = getTeamData(await (await fetch(baseURL + "/assets/game/textChallenges.csv")).text(), inputTeam);
            values.set("textChallenges", textChallenges);
            localStorage.setItem("textChallenges", JSON.stringify(textChallenges));
        } catch (error) {
            switch (error) {
                case "Invalid file":
                    enabledFeatures.tc = false;
                    window.console.warn("The file textChallenges.csv is invalid.");
                    break;
                case "Team not found":
                    document.getElementById("errorText").innerHTML = "Team Name Invalid";
                    document.getElementById("error").showModal();
                    return;
            }
        }
    }

    localStorage.setItem("enabledFeatures", JSON.stringify(enabledFeatures));

    let primaryFile = "";
    if (enabledFeatures.th) {
        primaryFile = "textHints";
    } else if (enabledFeatures.ih) {
        primaryFile = "imageHints";
    } else if (enabledFeatures.tc) {
        primaryFile = "textChallenges";
    } else {
        document.getElementById("errorText").innerHTML = "No valid CSV files are present.";
        document.getElementById("error").showModal();
        return;
    }

    const primaryFileData = values.get(primaryFile);

    localStorage.setItem("primaryFile", primaryFile);
    localStorage.setItem("createdTimestamp", String(Date.now()));
    localStorage.setItem("finalMilestone", primaryFileData[0][primaryFileData[0].length - 1]);

    setCookie("Team", primaryFileData[1][0], 1);
    let textHint;
    if (enabledFeatures.th) {
        textHint = values.get("textHints")[1][1];
    } else {
        textHint = "NULL";
    }
    let imageHint;
    if (enabledFeatures.ih) {
        imageHint = values.get("imageHints")[1][1];
    } else {
        imageHint = "NULL";
    }
    let textChallenge;
    if (enabledFeatures.tc) {
        textChallenge = values.get("textChallenges")[1][1];
    } else {
        textChallenge = "NULL";
    }
    renderHint(textHint, imageHint, textChallenge);
}

function hint() {
    "use strict";
    if (getCookie("Team") !== params.get("team")) {
        document.getElementById("errorText").innerHTML = "This clue is not meant for your team.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
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

    const milestones = values.get(primaryFile)[0];
    let invalidMilestone = true;
    for (let i = 1; i < milestones.length; i++) {
        if (milestones[i] === params.get("milestone")) {
            invalidMilestone = false;
        }
    }
    if (invalidMilestone) {
        document.getElementById("errorText").innerHTML = error1;
        document.getElementById("error").showModal();
    }
    const currentMilestone = milestones.indexOf(params.get("milestone"));
    let missingMilestone = false;
    for (let i = 1; i < currentMilestone; i++) {
        if (getCookie(milestones[i]) !== "Granted") {
            missingMilestone = true;
        }
    }
    if (missingMilestone) {
        document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    setCookie(milestones[currentMilestone], "Granted", 1);
    let textHint;
    if (enabledFeatures.th) {
        textHint = values.get("textHints")[1][currentMilestone + 1];
    } else {
        textHint = "NULL";
    }
    let imageHint;
    if (enabledFeatures.ih) {
        imageHint = values.get("imageHints")[1][currentMilestone + 1];
    } else {
        imageHint = "NULL";
    }
    let textChallenge;
    if (enabledFeatures.tc) {
        textChallenge = values.get("textChallenges")[1][currentMilestone + 1];
    } else {
        textChallenge = "NULL";
    }
    renderHint(textHint, imageHint, textChallenge);
}

function validate() {
    "use strict";
    if (getCookie("Team") !== params.get("team")) {
        document.getElementById("errorText").innerHTML = "This is not your team's finishing point.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }

    let d = new Date();
    let h = String(d.getHours()).padStart(2, "0");
    let m = String(d.getMinutes()).padStart(2, "0");
    let s = String(d.getSeconds()).padStart(2, "0");
    document.getElementById("completionTime").innerHTML = h + ":" + m + ":" + s;

    const primaryFileData = JSON.parse(localStorage.getItem(localStorage.getItem("primaryFile")));
    const milestones = primaryFileData[0];

    let completionCounter = milestones.length - 1;
    setCookie(milestones[milestones.length - 1], "Granted", 1);

    document.getElementById("validationParent").innerHTML = "";
    for (let i = 1; i < milestones.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "10px";
        label.innerHTML = "Milestone " + i + ":";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("validate-checkbox");
        checkbox.onclick = () => {
            return false;
        };
        if (getCookie(milestones[i]) === "Granted") {
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

    document.getElementById("validation").showModal();
}

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

function override() {
    "use strict";
    const primaryFileData = JSON.parse(localStorage.getItem(localStorage.getItem("primaryFile")));
    const milestones = primaryFileData[0];
    let overrideTeam = document.getElementById("overrideTeam").value;
    if (overrideTeam !== "") {
        setCookie("Team", overrideTeam, 10);
    }
    for (let i = 1; i < milestones.length; i++) {
        if (document.getElementById("overrideMilestone" + i).value !== "") {
            setCookie(document.getElementById("overrideMilestone" + i).value, "Granted", 1);
        }
    }
    closeDialogs();
}

function renderQR() {
    "use strict";
    document.getElementById("progressBar").style.width = "0px";
    document.getElementById("qr").showModal();
}

function closeDialogs() {
    "use strict";
    document.getElementById("error").close();
    document.getElementById("hint").close();
    document.getElementById("validation").close();
    document.getElementById("override").close();
    document.getElementById("qr").close();
}