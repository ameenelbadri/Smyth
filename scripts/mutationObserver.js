function clearSelectedNotes() {
    document
        .querySelectorAll("g.note.selected-note")
        .forEach(note => note.classList.remove("selected-note"));
}

function getPlistArray(element) {
    return element.getAttribute("plist")
        ?.split(/\s+/)
        .map(id => id.replace("#", ""));
}

function getAnnotationsForElement(elementId) {
    const annotations = JSON.parse(
        sessionStorage.getItem(`annotations:${getSceneMeiFile()}`) || "[]"
    );

    console.log(elementId, annotations, annotations.filter(annotation => { return annotation.plistArray.includes(elementId);}));
    return annotations.filter(annotation => {
        //const plistIds = getPlistArray(annotation)
        //return plistIds?.includes(elementId);
        return annotation.plistArray.includes(elementId);
    });
}

function clearAnnotationBoxes(svg = document) {
    svg.querySelectorAll(".annotation-box").forEach(box => box.remove());
}

function showAnnotationBox(svg, note, text) {
    const SVG_NS = "http://www.w3.org/2000/svg";

    const noteRect = note.getBoundingClientRect();
    const svgPoint = svg.createSVGPoint();

    svgPoint.x = noteRect.left + noteRect.width / 2;
    svgPoint.y = noteRect.top;

    const svgCoords = svgPoint.matrixTransform(svg.getScreenCTM().inverse());

    const group = document.createElementNS(SVG_NS, "g");
    group.classList.add("annotation-box");

    group.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    const padding = 8;
    const boxWidth = 220;
    const boxHeight = 42;
    const x = svgCoords.x - boxWidth / 2;
    const y = svgCoords.y - boxHeight - 12;

    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", boxWidth);
    rect.setAttribute("height", boxHeight);
    rect.setAttribute("rx", 4);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", x + padding);
    label.setAttribute("y", y + 25);
    label.setAttribute("font-size", "14");
    label.setAttribute("font-family", "Arial, Helvetica, sans-serif");
    label.textContent = text;

    group.appendChild(rect);
    group.appendChild(label);
    svg.appendChild(group);
}

function observeScoreRender(scoreId, onRender) {
    const score = document.getElementById(scoreId);

    const observer = new MutationObserver(() => {
        const svg = score.querySelector("svg");
        if (svg) onRender(svg, score, observer);
        svg.querySelectorAll("g.note").forEach(note => {
            note.addEventListener("click", (event) => {
                event.stopPropagation();
                clearSelectedNotes();
                clearAnnotationBoxes(svg);
                note.classList.add("selected-note");
                const noteId = note.id;
                console.log(note);
                const matchingAnnotations = getAnnotationsForElement(noteId);
                if (matchingAnnotations.length > 0) {
                    const annotationText = matchingAnnotations
                        .map(annotation => annotation.text)
                        .join("\n");
                    showAnnotationBox(svg, note, annotationText);
                }
            });
        });
    });

    observer.observe(score, { childList: true });
}

document.addEventListener("click", () => {
    clearSelectedNotes();
    clearAnnotationBoxes();
});

document.addEventListener("DOMContentLoaded", () => {
    observeScoreRender("score1", (svg) => {
        console.log("score1 rendered", svg);
    });

    observeScoreRender("score2", (svg) => {
        console.log("score2 rendered", svg);
    });
});