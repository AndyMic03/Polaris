const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let teams = [];
let locations = [];
let eventName;

const error1 = "Error 1: The URL Arguments are missing or wrong. Please contact the Game Organizer.";
const error2 = "Error 2: The Website Cookies are missing or wrong. Please contact the Game Organizer.";
const error3 = "Error 3: Possible URL error. Try rescanning the QR code";


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

let textHints;
let textChallenges;
let imageHints;

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
    if (localStorage.getItem("teams") === null || localStorage.getItem("locations") === null) {
        await (await fetch("assets/game/gameParameters.csv")).text().then((text) => {
            const lines = text.split('\n');
            eventName = lines[0];
            lines[1].split(';').forEach(team => {
                teams.push(team);
            });
            lines[2].split(';').forEach(location => {
                locations.push(location);
            });
            localStorage.setItem("teams", JSON.stringify(teams));
            localStorage.setItem("locations", JSON.stringify(locations));
            localStorage.setItem("eventName", eventName);
            localStorage.setItem("createdTimestamp", Date.now().toString());
            initialization();
        });
    } else {
        locations = JSON.parse(localStorage.getItem("locations"));
        teams = JSON.parse(localStorage.getItem("teams"));
        eventName = localStorage.getItem("eventName");
        initialization();
    }
    if (localStorage.getItem("textHints") === null) {
        await (await fetch("assets/game/textHints.csv")).text().then((text) => {
            textHints = parseHints(text);
            localStorage.setItem("textHints", JSON.stringify(textHints));
        });
    } else {
        textHints = JSON.parse(localStorage.getItem("textHints"));
    }
    if (localStorage.getItem("textChallenges") === null) {
        await (await fetch("assets/game/textChallenges.csv")).text().then((text) => {
            textChallenges = text.split("\n");
            localStorage.setItem("textChallenges", JSON.stringify(textChallenges));
        });
    } else {
        textChallenges = JSON.parse(localStorage.getItem("textChallenges"));
    }
    if (localStorage.getItem("imageHints") === null) {
        await (await fetch("assets/game/imageHints.csv")).text().then((text) => {
            imageHints = parseHints(text);
            localStorage.setItem("imageHints", JSON.stringify(imageHints));
        });
    } else {
        imageHints = JSON.parse(localStorage.getItem("imageHints"));
    }
});

docReady(function () {
    document.getElementById("overrideOK").addEventListener("click", override);
    document.getElementById("overrideExit").addEventListener("click", closeDialogs);
    document.getElementById("validateOK").addEventListener("click", closeDialogs);
    document.getElementById("hintOK").addEventListener("click", closeDialogs);
    document.getElementById("errorOK").addEventListener("click", closeDialogs);
})

function initialization() {
    if (teamCode === null && locationCode === null) {
        document.getElementById("welcome").style.display = "flex";
        document.getElementById("button").innerHTML = "Begin";
        document.getElementById("button").addEventListener("click", onboarding);
        document.getElementById("greeting").innerHTML = "We would like to welcome you to the " + eventName + ".<br>Please enter your designated team name to begin.";
        document.title = "Welcome | Scavenger Hunt";
        return;
    }
    if (teamCookie === "") {
        alert(error2);
        document.location.href = "./game.html";
        return;
    }

    let teamMatch = false;
    for (const team of teams)
        if (teamCode === team)
            teamMatch = true;

    let locationMatch = false;
    for (const location of locations)
        if (locationCode === location)
            locationMatch = true;

    if (!teamMatch || !locationMatch) {
        document.body.removeChild(document.getElementById("button"));
        alert(error3);
        return;
    }

    if (teamMatch && locationCode === locations[locations.length - 1]) {
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

function onboarding() {
    let inputTeam = document.getElementById("team").value;
    if (inputTeam === "")
        return;

    let teamMatch = false;
    for (const team of teams)
        if (team === inputTeam)
            teamMatch = true;
    if (!teamMatch) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }

    setCookie("Team", inputTeam, 1);
    teamCookie = getCookie("Team");
    let teamIndex = -1;
    for (let i = 0; i < teams.length; i++)
        if (teamCookie === teams[i])
            teamIndex = i;
    if (teamIndex === -1) {
        document.getElementById("errorText").innerHTML = error2;
        document.getElementById("error").showModal();
        return;
    }
    let text = textHints[teamIndex][0];
    let image = imageHints[teamIndex][0];
    let challenge = textChallenges[0];
    renderHint(text, image, challenge);
}

function hint() {
    teamCookie = getCookie("Team");
    let teamMatch = false;
    for (const team of teams)
        if (teamCode === team)
            teamMatch = true;
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
            if (i !== 0)
                for (let j = 0; j < i; j++)
                    if (getCookie(locations[j]) !== "Granted")
                        missingLocation = true;

            if (missingLocation) {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[i], "Granted", 1);
            for (let j = 0; j < teams.length; j++) {
                if (teamCode === teams[j]) {
                    invalidTeam = false;
                    let text = textHints[j][i + 1];
                    let image = imageHints[j][i + 1];
                    let challenge = textChallenges[i + 1];
                    renderHint(text, image, challenge);
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

    let d = new Date();
    let h = String(d.getHours()).padStart(2, "0");
    let m = String(d.getMinutes()).padStart(2, "0");
    let s = String(d.getSeconds()).padStart(2, "0");
    document.getElementById("completionTime").innerHTML = h + ":" + m + ":" + s;
    let completionCounter = locations.length;
    setCookie(locations[locations.length - 1], "Granted", 1);

    document.getElementById("validationParent").innerHTML = "";
    for (let i = 0; i < locations.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "5px";
        label.innerHTML = "Location " + (i + 1) + ":";

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
    document.getElementById("overrideParent").innerHTML = "";
    for (let i = 0; i < locations.length; i++) {
        const label = document.createElement("label");
        label.style.marginBottom = "5px";

        const input = document.createElement("input");
        input.id = "overrideLocation" + (i + 1);

        label.innerHTML = "Location " + (i + 1) + ": ";
        label.appendChild(input);
        document.getElementById("overrideParent").appendChild(label);
    }
    document.getElementById("override").showModal();
}

function override() {
    let overrideTeam = document.getElementById("overrideTeam").value;
    if (overrideTeam !== "")
        setCookie("Team", overrideTeam, 10);
    for (let i = 0; i < locations.length; i++) {
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