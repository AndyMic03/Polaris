const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

const error1 = "Error 1: The URL Arguments are missing or wrong. Please contact the Game Organizer.";
const error2 = "Error 2: The website Cookies are missing or wrong. Please contact the Game Organizer.";

function parseHints(hintsCsv, teamName) {
    let array = [];
    const lines = hintsCsv.split("\n");
    for (let i = 0; i < lines.length; i++) {
        const records = lines[i].split(";");
        if (i > 0 && records[0] !== teamName)
            continue;
        array.push([]);
        for (let j = 0; j < records.length; j++)
            array[array.length - 1][j] = records[j];
        if (i > 0)
            break;
    }
    if (array.length !== 2)
        return [];
    return array;
}

function docReady(fn) {
    if (document.readyState === "complete") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function getCookie(cName) {
    let name = cName + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function setCookie(cName, cValue, exDays) {
    const d = new Date();
    d.setTime(d.getTime() + (exDays * 86400000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

docReady(async () => {
    if (Date.now() - localStorage.getItem('createdTimestamp') > 86400000) {
        localStorage.clear();
    }
    document.getElementById("overrideOK").addEventListener("click", override);
    document.getElementById("overrideExit").addEventListener("click", closeDialogs);
    document.getElementById("validateOK").addEventListener("click", closeDialogs);
    document.getElementById("hintOK").addEventListener("click", closeDialogs);
    document.getElementById("errorOK").addEventListener("click", closeDialogs);
    await initialization();
});

async function initialization() {
    if (params.team === null && params.location === null) {
        const hintFile = await (await fetch("assets/game/textHints.csv")).text();
        const eventName = hintFile.split("\n")[0].split(";")[0];
        document.getElementById("welcome").style.display = "flex";
        document.getElementById("button").innerHTML = "Begin";
        document.getElementById("button").addEventListener("click", onboarding);
        document.getElementById("greeting").innerHTML = "We would like to welcome you to the " + eventName + ".<br>Please enter your designated team name to begin.";
        document.title = "Welcome | Scavenger Hunt";
        return;
    }

    const team = getCookie("Team");
    if (team === "") {
        alert(error2);
        document.location.href = "./game.html";
        return;
    }

    const finalLocation = localStorage.getItem("finalLocation");
    if (params.team === team && params.location === finalLocation) {
        document.getElementById("finish").style.display = "flex";
        document.getElementById("button").innerHTML = "Validate Result";
        document.getElementById("button").addEventListener("click", validate);
        document.title = "Validation | Scavenger Hunt"
        return;
    }

    document.getElementById("congratulations").style.display = "flex";
    document.getElementById("button").innerHTML = "View Hint";
    document.getElementById("button").addEventListener("click", hint);
    document.title = "Found Hint | Scavenger Hunt"
}

function renderHint(text, image, challenge) {
    if (text !== "NULL" && text !== "") {
        document.getElementById("hintContainer").style.display = "inline";
        document.getElementById("hintText").innerHTML = text;
    }
    if (image !== "NULL" && image !== "") {
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").src = image;
    }
    if (challenge !== "NULL" && challenge !== "") {
        document.getElementById("challengeContainer").style.display = "inline";
        document.getElementById("challengeText").innerHTML = challenge;
    }
    document.getElementById("hint").showModal();
}

async function onboarding() {
    let inputTeam = document.getElementById("team").value;
    if (inputTeam === "")
        return;

    const textHints = parseHints(await (await fetch("assets/game/textHints.csv")).text(), inputTeam);
    if (textHints.length === 0) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }
    localStorage.setItem("textHints", JSON.stringify(textHints));

    const imageHints = parseHints(await (await fetch("assets/game/imageHints.csv")).text(), inputTeam);
    if (imageHints.length === 0) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }
    localStorage.setItem("imageHints", JSON.stringify(imageHints));

    const textChallenges = parseHints(await (await fetch("assets/game/textChallenges.csv")).text(), inputTeam);
    if (textChallenges.length === 0) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }
    localStorage.setItem("textChallenges", JSON.stringify(textChallenges));

    localStorage.setItem("createdTimestamp", String(Date.now()));
    localStorage.setItem("finalLocation", textHints[0][textHints[0].length - 1]);

    setCookie("Team", textHints[1][0], 1);
    let text = textHints[1][1];
    let image = imageHints[1][1];
    let challenge = textChallenges[1][1];
    renderHint(text, image, challenge);
}

function hint() {
    if (getCookie("Team") !== params.team) {
        document.getElementById("errorText").innerHTML = "This clue is not meant for your team.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }

    const textHints = JSON.parse(localStorage.getItem("textHints"));
    const imageHints = JSON.parse(localStorage.getItem("imageHints"));
    const textChallenges = JSON.parse(localStorage.getItem("textChallenges"));

    const locations = textHints[0];
    let invalidLocation = true;
    for (let i = 1; i < locations.length; i++)
        if (locations[i] === params.location)
            invalidLocation = false;
    if (invalidLocation) {
        document.getElementById("errorText").innerHTML = error1;
        document.getElementById("error").showModal();
    }
    const currentLocation = locations.indexOf(params.location);
    let missingLocation = false;
    for (let i = 1; i < currentLocation; i++)
        if (getCookie(locations[i]) !== "Granted")
            missingLocation = true;
    if (missingLocation) {
        document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    setCookie(locations[currentLocation], "Granted", 1);
    const text = textHints[1][currentLocation + 1];
    const image = imageHints[1][currentLocation + 1];
    const challenge = textChallenges[1][currentLocation + 1];
    renderHint(text, image, challenge);
}

function validate() {
    if (getCookie("Team") !== params.team) {
        document.getElementById("errorText").innerHTML = "This is not your team's finishing point.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }

    let d = new Date();
    let h = String(d.getHours()).padStart(2, "0");
    let m = String(d.getMinutes()).padStart(2, "0");
    let s = String(d.getSeconds()).padStart(2, "0");
    document.getElementById("completionTime").innerHTML = h + ":" + m + ":" + s;

    const textHints = JSON.parse(localStorage.getItem("textHints"));
    const locations = textHints[0];

    let completionCounter = locations.length - 1;
    setCookie(locations[locations.length - 1], "Granted", 1);

    document.getElementById("validationParent").innerHTML = "";
    for (let i = 1; i < locations.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "5px";
        label.innerHTML = "Location " + i + ":";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.pointerEvents = "none";
        checkbox.onclick = () => {
            return false;
        }
        if (getCookie(locations[i]) === "Granted") {
            completionCounter--;
            checkbox.checked = true;
        } else
            checkbox.checked = false;

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
    const textHints = JSON.parse(localStorage.getItem("textHints"));
    const locations = textHints[0];

    document.getElementById("overrideParent").innerHTML = "";
    for (let i = 1; i < locations.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "5px";

        const input = document.createElement("input");
        input.id = "overrideLocation" + i;

        label.innerHTML = "Location " + i + ": ";
        label.appendChild(input);
        document.getElementById("overrideParent").appendChild(label);
    }
    document.getElementById("override").showModal();
}

function override() {
    const textHints = JSON.parse(localStorage.getItem("textHints"));
    const locations = textHints[0];
    let overrideTeam = document.getElementById("overrideTeam").value;
    if (overrideTeam !== "")
        setCookie("Team", overrideTeam, 10);
    for (let i = 1; i < locations.length; i++) {
        if (document.getElementById("overrideLocation" + i).value !== "")
            setCookie(document.getElementById("overrideLocation" + i), "Granted", 1);
    }
    closeDialogs();
}

function closeDialogs() {
    document.getElementById("error").close();
    document.getElementById("hint").close();
    document.getElementById("validation").close();
    document.getElementById("override").close();
}