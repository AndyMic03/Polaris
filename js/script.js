const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

let teams = [];
let locations = [];

function parseParameters(parametersCsv) {
    const lines = parametersCsv.split('\n');
    lines[0].split(';').forEach(team => {teams.push(team)});
    lines[1].split(';').forEach(location => {locations.push(location)});
    localStorage.setItem("teams", JSON.stringify(teams));
    localStorage.setItem("locations", JSON.stringify(locations));
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
let l0Cookie;
let l1Cookie;
let l2Cookie;
let l3Cookie;
let l4Cookie;
let l5Cookie;
let l6Cookie;
let l7Cookie;
let l8Cookie;
let l9Cookie;

let textHints;
let imageHints;

function updateCookies() {
    textHints = getCookie("Team");
    switch (locations.length - 1){
        case 9:
            l9Cookie = getCookie(locations[9]);
        case 8:
            l8Cookie = getCookie(locations[8]);
        case 7:
            l7Cookie = getCookie(locations[7]);
        case 6:
            l6Cookie = getCookie(locations[6]);
        case 5:
            l5Cookie = getCookie(locations[5]);
        case 4:
            l4Cookie = getCookie(locations[4]);
        case 3:
            l3Cookie = getCookie(locations[3]);
        case 2:
            l2Cookie = getCookie(locations[2]);
        case 1:
            l1Cookie = getCookie(locations[1]);
        case 0:
            l0Cookie = getCookie(locations[0]);
    }
}

docReady(async function () {
    if (localStorage.getItem("teams") === null || localStorage.getItem("locations") === null) {
        await (await fetch("assets/game/gameParameters.csv")).text().then(function (text) {
            parseParameters(text);
        });
    } else {
        locations = JSON.parse(localStorage.getItem("locations"));
        teams = JSON.parse(localStorage.getItem("teams"));
    }
    updateCookies();
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

docReady(function () {
    if (teamCode === "welcome" && locationCode === "welcome") {
        document.getElementById("welcome").style.display = "flex";
        document.getElementById("button").innerHTML = "Begin";
        document.getElementById("button").addEventListener("click", onboarding);
        document.getElementById("button").addEventListener("touchstart", onboarding);
        return;
    }
    if (teamCode === null && locationCode === null) {
        alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
        return;
    }
    if (teamCookie === null) {
        alert("Error 2: Please tell your ESNer to use their ESNer Override Kit.");
        return;
    }
    let teamMatch = false;
    teams.forEach(team => {if(teamCode === team){teamMatch = true}});
    if (teamMatch && locationCode === locations[locations.length - 1]) {
        document.getElementById("finish").style.display = "flex";
        document.getElementById("button").innerHTML = "Validate Result";
        document.getElementById("button").addEventListener("click", validate);
        document.getElementById("button").addEventListener("touchstart", validate);
        return;
    }
    let locationMatch = false;
    locations.forEach(location => {if(locationCode === location){locationMatch = true}});
    if (teamCookie && locationMatch) {
        document.getElementById("congratulations").style.display = "flex";
        document.getElementById("button").innerHTML = "View Hint";
        document.getElementById("button").addEventListener("click", revealHint);
        document.getElementById("button").addEventListener("touchstart", revealHint);
        return;
    }
    alert("Error 3: Unexpected Condition met. Possible URL error. Try rescanning the QR code");
});

function onboarding() {
    let eTeam = document.getElementById("team").value;
    if (eTeam === "")
        return;
    let teamMatch = false;
    teams.forEach(team => {if(eTeam === team){teamMatch = true}});
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
        alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
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
    teams.forEach(team => {if(teamCode === team){teamMatch = true}});
    if (!teamMatch) {
        document.getElementById("errorText").innerHTML = "Error 1: Please tell your ESNer to use their ESNer Override Kit.";
        document.getElementById("error").showModal();
        return;
    }
    if (teamCookie !== teamCode) {
        document.getElementById("errorText").innerHTML = "This clue is not meant for your team.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    let teamIndex;
    let locationIndex;
    switch (locationCode) {
        case locations[0]:
            setCookie(locations[0], "Granted", 10);
            locationIndex = 1;
            break;
        case locations[1]:
            if (l0Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[1], "Granted", 10);
            locationIndex = 2;
            break;
        case locations[2]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[2], "Granted", 10);
            locationIndex = 3;
            break;
        case locations[3]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[3], "Granted", 10);
            locationIndex = 4;
            break;
        case locations[4]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[4], "Granted", 10);
            locationIndex = 5;
            break;
        case locations[5]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted" || l4Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[5], "Granted", 10);
            locationIndex = 6;
            break;
        case locations[6]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted" || l4Cookie !== "Granted" || l5Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[6], "Granted", 10);
            locationIndex = 7;
            break;
        case locations[7]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted" || l4Cookie !== "Granted" || l5Cookie !== "Granted" || l6Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[7], "Granted", 10);
            locationIndex = 8;
            break;
        case locations[8]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted" || l4Cookie !== "Granted" || l5Cookie !== "Granted" || l6Cookie !== "Granted" || l7Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[8], "Granted", 10);
            locationIndex = 9;
            break;
        case locations[9]:
            if (l0Cookie !== "Granted" || l1Cookie !== "Granted" || l2Cookie !== "Granted" || l3Cookie !== "Granted" || l4Cookie !== "Granted" || l5Cookie !== "Granted" || l6Cookie !== "Granted" || l7Cookie !== "Granted" || l8Cookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie(locations[9], "Granted", 10);
            locationIndex = 10;
            break;
        default:
            alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
    }
    switch (teamCode) {
        case teams[0]:
            teamIndex = 0;
            break;
        case teams[1]:
            teamIndex = 1;
            break;
        case teams[2]:
            teamIndex = 2;
            break;
        case teams[3]:
            teamIndex = 3;
            break;
        case teams[4]:
            teamIndex = 4;
            break;
        case teams[5]:
            teamIndex = 5;
            break;
        case teams[6]:
            teamIndex = 6;
            break;
        case teams[7]:
            teamIndex = 7;
            break;
        case teams[8]:
            teamIndex = 8;
            break;
        case teams[9]:
            teamIndex = 9;
            break;
        default:
            alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
    }
    let txt = textHints[teamIndex][locationIndex];
    let img = imageHints[teamIndex][locationIndex];
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
    updateCookies();
    if (l0Cookie === "Granted") {
        document.getElementById("validationLocation0").checked = true;
        completionCounter--;
    }
    if (l1Cookie === "Granted") {
        document.getElementById("validationLocation1").checked = true;
        completionCounter--;
    }
    if (l2Cookie === "Granted") {
        document.getElementById("validationLocation2").checked = true;
        completionCounter--;
    }
    if (l3Cookie === "Granted") {
        document.getElementById("validationLocation3").checked = true;
        completionCounter--;
    }
    if (l4Cookie === "Granted") {
        document.getElementById("validationLocation4").checked = true;
        completionCounter--;
    }
    if (l5Cookie === "Granted") {
        document.getElementById("validationLocation5").checked = true;
        completionCounter--;
    }
    if (l6Cookie === "Granted") {
        document.getElementById("validationLocation6").checked = true;
        completionCounter--;
    }
    if (l7Cookie === "Granted") {
        document.getElementById("validationLocation7").checked = true;
        completionCounter--;
    }
    if (l8Cookie === "Granted") {
        document.getElementById("validationLocation8").checked = true;
        completionCounter--;
    }
    if (l9Cookie === "Granted") {
        document.getElementById("validationLocation9").checked = true;
        completionCounter--;
    }
    if (completionCounter > 0)
        document.getElementById("completionLabel").style.display = "none";
    document.getElementById("completionTime").innerHTML = h + ":" + m + ":" + s;
    switch (locations.length){
        case 1:
            document.getElementById("validationContainer1").style.display = "none";
        case 2:
            document.getElementById("validationContainer2").style.display = "none";
        case 3:
            document.getElementById("validationContainer3").style.display = "none";
        case 4:
            document.getElementById("validationContainer4").style.display = "none";
        case 5:
            document.getElementById("validationContainer5").style.display = "none";
        case 6:
            document.getElementById("validationContainer6").style.display = "none";
        case 7:
            document.getElementById("validationContainer7").style.display = "none";
        case 8:
            document.getElementById("validationContainer8").style.display = "none";
        case 9:
            document.getElementById("validationContainer9").style.display = "none";
    }
    document.getElementById("validation").showModal();
}

function openOverride() {
    switch (locations.length){
        case 1:
            document.getElementById("overrideContainer1").style.display = "none";
        case 2:
            document.getElementById("overrideContainer2").style.display = "none";
        case 3:
            document.getElementById("overrideContainer3").style.display = "none";
        case 4:
            document.getElementById("overrideContainer4").style.display = "none";
        case 5:
            document.getElementById("overrideContainer5").style.display = "none";
        case 6:
            document.getElementById("overrideContainer6").style.display = "none";
        case 7:
            document.getElementById("overrideContainer7").style.display = "none";
        case 8:
            document.getElementById("overrideContainer8").style.display = "none";
        case 9:
            document.getElementById("overrideContainer9").style.display = "none";
    }
    document.getElementById("esnOverride").showModal();
}

function override() {
    let overrideTeam = document.getElementById("overrideTeam").value;
    let overrideLocation0 = document.getElementById("overrideLocation0").value;
    let overrideLocation1 = document.getElementById("overrideLocation1").value;
    let overrideLocation2 = document.getElementById("overrideLocation2").value;
    let overrideLocation3 = document.getElementById("overrideLocation3").value;
    let overrideLocation4 = document.getElementById("overrideLocation4").value;
    let overrideLocation5 = document.getElementById("overrideLocation5").value;
    let overrideLocation6 = document.getElementById("overrideLocation6").value;
    let overrideLocation7 = document.getElementById("overrideLocation7").value;
    let overrideLocation8 = document.getElementById("overrideLocation8").value;
    let overrideLocation9 = document.getElementById("overrideLocation9").value;

    if (overrideTeam !== "")
        setCookie("Team", overrideTeam, 10);
    if (overrideLocation0 !== "")
        setCookie(overrideLocation0.toString(), "Granted", 10);
    if (overrideLocation1 !== "")
        setCookie(overrideLocation1.toString(), "Granted", 10);
    if (overrideLocation2 !== "")
        setCookie(overrideLocation2.toString(), "Granted", 10);
    if (overrideLocation3 !== "")
        setCookie(overrideLocation3.toString(), "Granted", 10);
    if (overrideLocation4 !== "")
        setCookie(overrideLocation4.toString(), "Granted", 10);
    if (overrideLocation5 !== "")
        setCookie(overrideLocation5.toString(), "Granted", 10);
    if (overrideLocation6 !== "")
        setCookie(overrideLocation6.toString(), "Granted", 10);
    if (overrideLocation7 !== "")
        setCookie(overrideLocation7.toString(), "Granted", 10);
    if (overrideLocation8 !== "")
        setCookie(overrideLocation8.toString(), "Granted", 10);
    if (overrideLocation9 !== "")
        setCookie(overrideLocation9.toString(), "Granted", 10);

    updateCookies();

    closeDialog();
}

function closeDialog() {
    document.getElementById("error").close();
    document.getElementById("hint").close();
    document.getElementById("validation").close();
    document.getElementById("esnOverride").close();
}