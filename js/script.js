const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
});

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

let teamCookie = getCookie("Team");
let limboCookie = getCookie("Limbo");
let lustCookie = getCookie("Lust");
let greedCookie = getCookie("Greed");
let wrathCookie = getCookie("Wrath");
let fraudCookie = getCookie("Fraud");
let treacheryCookie = getCookie("Treachery");
const teamCode = params.team;
const locationCode = params.location;
let textHints;
let imageHints;

docReady(async function () {
    await (await fetch("assets/hints/textHints.csv")).text().then(function (text) {textHints = parseHints(text);});
    await (await fetch("assets/hints/imageHints.csv")).text().then(function (text) {imageHints = parseHints(text);});
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
    d.setTime(d.getTime() + (exDays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
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
    if ((teamCode === "Io" || teamCode === "Europa" || teamCode === "Ganymede" || teamCode === "Callisto" || teamCode === "Amalthea" || teamCode === "Himalia") && (locationCode === "Limbo" || locationCode === "Lust" || locationCode === "Greed" || locationCode === "Wrath" || locationCode === "Fraud")) {
        document.getElementById("congratulations").style.display = "flex";
        document.getElementById("button").innerHTML = "View Hint";
        document.getElementById("button").addEventListener("click", revealHint);
        document.getElementById("button").addEventListener("touchstart", revealHint);
        return;
    }
    if ((teamCode === "Io" || teamCode === "Europa" || teamCode === "Ganymede" || teamCode === "Callisto" || teamCode === "Amalthea" || teamCode === "Himalia") && (locationCode === "Treachery")){
        document.getElementById("finish").style.display = "flex";
        document.getElementById("button").innerHTML = "Validate Result";
        document.getElementById("button").addEventListener("click", validate);
        document.getElementById("button").addEventListener("touchstart", validate);
        return;
    }
    alert("Unexpected Condition met. Webpage Rendering Halted.");
});

function onboarding(){
    let team = document.getElementById("team").value;
    if (team === "")
        return;
    if (!(team === "Io" || team === "Europa" || team === "Ganymede" || team === "Callisto" || team === "Amalthea" || team === "Himalia")) {
        document.getElementById("errorText").innerHTML = "Team Name Invalid";
        document.getElementById("error").showModal();
        return;
    }
    setCookie("Team", team, 10);
    teamCookie = getCookie("Team");
    let teamIndex;
    switch (teamCookie) {
        case "Io":
            teamIndex = 0;
            break;
        case "Europa":
            teamIndex = 1;
            break;
        case "Ganymede":
            teamIndex = 2;
            break;
        case "Callisto":
            teamIndex = 3;
            break;
        case "Amalthea":
            teamIndex = 4;
            break;
        case "Himalia":
            teamIndex = 5;
            break;
        default:
            alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
    }
    let txt = textHints[teamIndex][0];
    let img = imageHints[teamIndex][0];
    if (txt !== "NULL"  && txt !== ""){
        document.getElementById("hintText").style.display = "inline";
        document.getElementById("hintText").innerHTML = txt;
    }
    if (img !== "NULL" && img !== ""){
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").source = img;
    }
    document.getElementById("hint").showModal();
}

function revealHint() {
    teamCookie = getCookie("Team");
    if (!(teamCookie === "Io" || teamCookie === "Europa" || teamCookie === "Ganymede" || teamCookie === "Callisto" || teamCookie === "Amalthea" || teamCookie === "Himalia")) {
        document.getElementById("errorText").innerHTML = "Error 1: Please tell your ESNer to use their ESNer Override Kit.";
        document.getElementById("error").showModal();
        return;
    }
    if(teamCookie !== teamCode){
        document.getElementById("errorText").innerHTML = "This clue is not meant for your team.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    let teamIndex;
    let locationIndex;
    switch (locationCode) {
        case "Limbo":
            setCookie("Limbo", "Granted", 10);
            locationIndex = 1;
            break;
        case "Lust":
            if (limboCookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie("Lust", "Granted", 10);
            locationIndex = 2;
            break;
        case "Greed":
            if (limboCookie !== "Granted" || lustCookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie("Greed", "Granted", 10);
            locationIndex = 3;
            break;
        case "Wrath":
            if (limboCookie !== "Granted" || lustCookie !== "Granted" || greedCookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie("Wrath", "Granted", 10);
            locationIndex = 4;
            break;
        case "Fraud":
            if (limboCookie !== "Granted" || lustCookie !== "Granted" || greedCookie !== "Granted" || wrathCookie !== "Granted") {
                document.getElementById("errorText").innerHTML = "You're not supposed to be here yet.<br>Keep looking.";
                document.getElementById("error").showModal();
                return;
            }
            setCookie("Fraud", "Granted", 10);
            locationIndex = 5;
            break;
        default:
            alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
    }
    switch (teamCode) {
        case "Io":
            teamIndex = 0;
            break;
        case "Europa":
            teamIndex = 1;
            break;
        case "Ganymede":
            teamIndex = 2;
            break;
        case "Callisto":
            teamIndex = 3;
            break;
        case "Amalthea":
            teamIndex = 4;
            break;
        case "Himalia":
            teamIndex = 5;
            break;
        default:
            alert("Error 1: Please tell your ESNer to use their ESNer Override Kit.");
    }
    let txt = textHints[teamIndex][locationIndex];
    let img = imageHints[teamIndex][locationIndex];
    if (txt !== "NULL"  && txt !== ""){
        document.getElementById("hintText").style.display = "inline";
        document.getElementById("hintText").innerHTML = txt;
    }
    if (img !== "NULL" && img !== ""){
        document.getElementById("hintImage").style.display = "inline";
        document.getElementById("hintImage").source = img;
    }
    document.getElementById("hint").showModal();
}

function validate() {
    let d = new Date(); // for now
    let h = d.getHours();
    let m = d.getMinutes();
    let s = d.getSeconds();
    if (h<10)
        h="0"+h;
    if (m<10)
        m="0"+m;
    if (s<10)
        s="0"+s;
    if(teamCode !== teamCookie){
        document.getElementById("errorText").innerHTML = "This is not your team's finishing point.<br>Keep looking.";
        document.getElementById("error").showModal();
        return;
    }
    document.getElementById("validation").showModal();
    let completionCounter = 6;
    setCookie("Treachery", "Granted", 10);
    treacheryCookie = getCookie("Treachery");
    if(limboCookie==="Granted") {
        document.getElementById("validationLocation1").checked = true;
        completionCounter--;
    }
    if(lustCookie==="Granted"){
        document.getElementById("validationLocation2").checked = true;
        completionCounter--;
    }
    if(greedCookie==="Granted"){
        document.getElementById("validationLocation3").checked = true;
        completionCounter--;
    }
    if(wrathCookie==="Granted"){
        document.getElementById("validationLocation4").checked = true;
        completionCounter--;
    }
    if(fraudCookie==="Granted"){
        document.getElementById("validationLocation5").checked = true;
        completionCounter--;
    }
    if(treacheryCookie==="Granted"){
        document.getElementById("validationLocation6").checked = true;
        completionCounter--;
    }
    if (completionCounter>0)
        document.getElementById("completionLabel").style.display = "none";
    document.getElementById("completionTime").innerHTML = h+":"+m+":"+s;
}

function openOverride() {
    document.getElementById("esnOverride").showModal()
}

function override() {
    let overrideTeam = document.getElementById("overrideTeam").value;
    let overrideLocation1 = document.getElementById("overrideLocation1").value;
    let overrideLocation2 = document.getElementById("overrideLocation2").value;
    let overrideLocation3 = document.getElementById("overrideLocation3").value;
    let overrideLocation4 = document.getElementById("overrideLocation4").value;
    let overrideLocation5 = document.getElementById("overrideLocation5").value;
    let overrideLocation6 = document.getElementById("overrideLocation6").value;

    if (overrideTeam !== "")
        setCookie("Team", overrideTeam, 10);
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

    teamCookie = getCookie("Team");
    limboCookie = getCookie("Limbo");
    lustCookie = getCookie("Lust");
    greedCookie = getCookie("Greed");
    wrathCookie = getCookie("Wrath");
    fraudCookie = getCookie("Fraud");
    treacheryCookie = getCookie("Treachery");

    closeDialog();
}

function closeDialog() {
    document.getElementById("error").close();
    document.getElementById("hint").close();
    document.getElementById("validation").close();
    document.getElementById("esnOverride").close();
}