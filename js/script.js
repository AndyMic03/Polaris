const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let teams = [];
let locations = [];
let eventName;

const error1 = "Error 1: The URL Arguments are missing or wrong. Please contact the Game Organizer.";
const error2 = "Error 2: The Website Cookies are missing or wrong. Please contact the Game Organizer.";
const error3 = "Error 3: Possible URL error. Try rescanning the QR code";

function parseParameters(parametersCsv) {
    const lines = parametersCsv.split('\n');
    eventName = lines[0];
    lines[1].split(';').forEach(team => {
        teams.push(team)
    });
    lines[2].split(';').forEach(location => {
        locations.push(location)
    });
    localStorage.setItem("teams", JSON.stringify(teams));
    localStorage.setItem("locations", JSON.stringify(locations));
    localStorage.setItem("eventName", eventName);
}

function parseHints(hintsCsv) {
    let array = [];
    const lines = hintsCsv.split('\n');
    for (let i = 0; i < lines.length; i++) {
        array[i] = [];
        const records = lines[i].split(';');
        for (let j = 0; j < records.length; j++) {
            array[i][j] = records[j];
        }
    }
    return array;
}

function docReady(fn) {
    if (document.readyState === "complete") {
        fn();
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

const teamCode = params.team;
const locationCode = params.location;

let teamCookie = getCookie("Team");

let overrideCompleted = false;
let validateCompleted = false;


let textHints;
let imageHints;

docReady(async function () {
    if (localStorage.getItem("teams") === null || localStorage.getItem("locations") === null) {
        await (await fetch("assets/game/gameParameters.csv")).text().then(function (text) {
            parseParameters(text);
        });
    } else {
        locations = JSON.parse(localStorage.getItem("locations"));
        teams = JSON.parse(localStorage.getItem("teams"));
        eventName = localStorage.getItem("eventName");
    }
    if (localStorage.getItem("textHints") === null) {
        await (await fetch("assets/game/textHints.csv")).text().then(function (text) {
            textHints = parseHints(text);
            localStorage.setItem("textHints", JSON.stringify(textHints));
        });
    } else {
        textHints = JSON.parse(localStorage.getItem("textHints"));
    }
    if (localStorage.getItem("imageHints") === null) {
        await (await fetch("assets/game/imageHints.csv")).text().then(function (text) {
            imageHints = parseHints(text);
            localStorage.setItem("imageHints", JSON.stringify(imageHints));
        });
    } else {
        imageHints = JSON.parse(localStorage.getItem("imageHints"));
    }
    let date = new Date();
    document.getElementById("footer").innerHTML = "&copy" + date.getFullYear() + " <b>Andreas Michael</b>";
    initialization();
});

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
    d.setTime(d.getTime() + (exDays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

docReady(function () {
    document.getElementById("overrideOK").addEventListener("click", override);
    document.getElementById("overrideExit").addEventListener("click", closeDialog);
    document.getElementById("validateOK").addEventListener("click", closeDialog);
    document.getElementById("hintOK").addEventListener("click", closeDialog);
    document.getElementById("errorOK").addEventListener("click", closeDialog);

    document.getElementById("overrideOK").addEventListener("touchstart", override);
    document.getElementById("overrideExit").addEventListener("touchstart", closeDialog);
    document.getElementById("validateOK").addEventListener("touchstart", closeDialog);
    document.getElementById("hintOK").addEventListener("touchstart", closeDialog);
    document.getElementById("errorOK").addEventListener("touchstart", closeDialog);
})

function initialization () {
    if (teamCode === "welcome" && locationCode === "welcome") {
        document.getElementById("welcome").style.display = "flex";
        document.getElementById("button").innerHTML = "Begin";
        document.getElementById("button").addEventListener("click", onboarding);
        document.getElementById("button").addEventListener("touchstart", onboarding);
        document.getElementById("greeting").innerHTML = "We would like to welcome you to the " + eventName + ".<br>Please enter your designated team name to begin.";
        document.title = "Welcome | Scavenger Hunt";
        return;
    }
    if (teamCode === null && locationCode === null) {
        alert(error1);
        return;
    }
    if (teamCookie === null) {
        alert(error2);
        return;
    }
    let teamMatch = false;
    teams.forEach(team => {
        if (teamCode === team) {
            teamMatch = true
        }
    });
    if (teamMatch && locationCode === locations[locations.length - 1]) {
        document.getElementById("finish").style.display = "flex";
        document.getElementById("button").innerHTML = "Validate Result";
        document.getElementById("button").addEventListener("click", validate);
        document.getElementById("button").addEventListener("touchstart", validate);
        document.title = "Validation | Scavenger Hunt"
        return;
    }
    let locationMatch = false;
    locations.forEach(location => {
        if (locationCode === location) {
            locationMatch = true
        }
    });
    if (teamCookie && locationMatch) {
        document.getElementById("congratulations").style.display = "flex";
        document.getElementById("button").innerHTML = "View Hint";
        document.getElementById("button").addEventListener("click", revealHint);
        document.getElementById("button").addEventListener("touchstart", revealHint);
        document.title = "Found Hint | Scavenger Hunt"
        return;
    }
    alert(error3);
}

function onboarding() {
    let eTeam = document.getElementById("team").value;
    if (eTeam === "")
        return;
    let teamMatch = false;
    teams.forEach(team => {
        if (eTeam === team) {
            teamMatch = true
        }
    });
    if (!teamMatch) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }
    setCookie("Team", eTeam, 10);
    teamCookie = getCookie("Team");
    let teamIndex = -1;
    for (let i = 0; i < teams.length - 1; i++) {
        if (teamCookie === teams[i]) {
            teamIndex = i;
            break;
        }
    }
    if (teamIndex === -1) {
        document.getElementById("errorText").innerHTML = error2;
        document.getElementById("error").showModal();
        return;
    }
    let txt = textHints[teamIndex][0];
    let img = imageHints[teamIndex][0];
    if (txt !== "NULL" && txt !== "") {
        document.getElementById("hintText").style.display = "inline";
        document.getElementById("hintText").innerHTML = txt;
    }
    if (img !== "NULL" && img !== "") {
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").source = img;
    }
    document.getElementById("hint").showModal();
}

function revealHint() {
    teamCookie = getCookie("Team");
    let teamMatch = false;
    teams.forEach(team => {
        if (teamCode === team) {
            teamMatch = true
        }
    });
    if (!teamMatch) {
        document.getElementById("errorText").innerHTML = error1;
        document.getElementById("error").showModal();
        return;
    }
    if (teamCookie !== teamCode) {
        document.getElementById("errorText").innerHTML = "This clue is not meant for your team.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    let invalidLocation = true;
    let invalidTeam = true;
    for (let i = 0; i < locations.length; i++) {
        if (locationCode === locations[i]) {
            invalidLocation = false;
            let missingLocation = false;
            if (i !== 0) {
                for (let j = 0; j < i; j++) {
                    if (getCookie(locations[j]) !== "Granted")
                        missingLocation = true;
                }
            }
            if (missingLocation) {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[i], "Granted", 10);
            for (let j = 0; j < teams.length; j++) {
                if (teamCode === teams[j]) {
                    invalidTeam = false;
                    let txt = textHints[j][i + 1];
                    let img = imageHints[j][i + 1];
                    if (txt !== "NULL" && txt !== "") {
                        document.getElementById("hintText").style.display = "inline";
                        document.getElementById("hintText").innerHTML = txt;
                    }
                    if (img !== "NULL" && img !== "") {
                        document.getElementById("hintImage").style.display = "inline";
                        document.getElementById("hintImage").source = img;
                    }
                    document.getElementById("hint").showModal();
                    return;
                }
            }
        }
    }
    if (invalidLocation || invalidTeam) {
        document.getElementById("errorText").innerHTML = error1;
        document.getElementById("error").showModal();
    }
}

function validate() {
    if (teamCode !== teamCookie) {
        document.getElementById("errorText").innerHTML = "This is not your team's finishing point.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    let d = new Date(); // for now
    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds();
    if (h < 10)
        h = "0" + h;
    if (m < 10)
        m = "0" + m;
    if (s < 10)
        s = "0" + s;
    let completionCounter = locations.length;
    setCookie(locations[locations.length - 1], "Granted", 10);
    if (validateCompleted)
        document.getElementById("validationParent").innerHTML = "";
    for (let i = 0; i < locations.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "5px";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.style.pointerEvents = "none";
        checkbox.onclick = function () {
            return false;
        }
        if (getCookie(locations[i]) === "Granted") {
            completionCounter--;
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }

        label.innerHTML = "Location " + (i + 1) + ":";
        label.appendChild(checkbox);
        document.getElementById("validationParent").appendChild(label);
    }
    validateCompleted = true;
    document.getElementById("completionTime").innerHTML = h + ":" + m + ":" + s;
    if (completionCounter > 0) {
        document.getElementById("completionLabel").style.display = "none";
        document.getElementById("validationError").innerHTML = "You haven't found all the clues";
        document.getElementById("validationError").style.display = "inline";
    }
    document.getElementById("validation").showModal();
}

function openOverride() {
    for (let i = 0; i < locations.length; i++) {
        if (overrideCompleted)
            break;

        const label = document.createElement("label");
        label.style.marginBottom = "5px";

        const input = document.createElement("input");
        input.id = "overrideLocation" + (i + 1);

        label.innerHTML = "Location " + (i + 1) + ": ";
        label.appendChild(input);
        document.getElementById("overrideParent").insertBefore(label, document.getElementById("overrideAnchor"));
    }
    overrideCompleted = true;
    document.getElementById("override").showModal();
}

function override() {
    let overrideTeam = document.getElementById("overrideTeam").value;
    if (overrideTeam !== "")
        setCookie("Team", overrideTeam, 10);
    for (let i = 0; i < locations.length; i++) {
        if (document.getElementById("overrideLocation" + i).value !== "")
            setCookie(document.getElementById("overrideLocation" + i), "Granted", 10);
    }
    closeDialog();
}

function closeDialog() {
    document.getElementById("error").close();
    document.getElementById("hint").close();
    document.getElementById("validation").close();
    document.getElementById("override").close();
}