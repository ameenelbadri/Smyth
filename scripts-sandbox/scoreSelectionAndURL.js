const params = new URLSearchParams(window.location.search);

const act = params.get("act");
const scene = params.get("scene");
const bar = params.get("bar");

console.log("Act:", act);
console.log("Scene:", scene);
console.log("Bar:", bar);

const scenes = {
"1-prelude": {
    title: "Act I - Prélude",
    mei: "../mei/act1-prelude.mei"
},
"1-1": {
    title: "Act I - Scène I",
    mei: "../mei/act1-scene1.mei"
},
"1-8": {
    title: "Act I - Scène VIII",
    mei: "../mei/TEST-ORIGINAL.mei"
},
};

const selectedAct = act || "1";
const selectedScene = scene || "8";
const key = `${selectedAct}-${selectedScene}`;
const currentScene = scenes[key];
const pageTitle = `Les Naufrageurs - ${getSceneTitle()}`;

document.title = pageTitle;
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("sceneTitle").textContent = pageTitle;
});

function getSceneTitle() {
    const actNames = {
        1: "Act I",
        2: "Act II",
        3: "Act III"
    };
    const selectedAct = act || "1";
    const selectedScene = scene || "8";
    const actTitle = actNames[selectedAct] || `Act ${selectedAct}`;

    if (selectedScene === "prelude") {
        return `${actTitle}, Prélude`;
    }

    return `${actTitle}, Scène ${selectedScene}`;
}

function getSceneMeiFile() {
    const selectedAct = act || "1";
    const selectedScene = scene || "8";

    if (selectedScene === "prelude") {
        return `../mei/act${selectedAct}-prelude.mei`;
    }

    return `../mei/act${selectedAct}-scene${selectedScene}.mei`;
}

function shouldStackCompareScores() {
    const selectedAct = act || "1";
    const selectedScene = scene || "8";

    return selectedScene === "prelude" && ["1", "2"].includes(selectedAct);
}
document.body.classList.toggle("stacked-compare", shouldStackCompareScores());

function getVerovioPageHeight(engraving) {
    const selectedScene = scene || "8";

    if (selectedScene === "prelude") {
        return 100;
    }

    return Math.min(engraving.clientWidth, window.innerHeight - 200);
}

function getBarRange() {
    if (!bar) {
        return null;
    }

    if (/^\d+-\d+$/.test(bar)) {
        return bar;
    }

    return null;
}

function getStartingBar() {
    return /^\d+$/.test(bar) ? bar : null;
}

function getMeasureId(meiData, measureNumber) {
    const meiDocument = new DOMParser().parseFromString(meiData, "application/xml");
    const measure = meiDocument.querySelector(`measure[n="${measureNumber}"]`);

    return measure?.getAttribute("xml:id") || null;
}
