	document.addEventListener("DOMContentLoaded", (event) => {
		verovio.module.onRuntimeInitialized = function () {
			
			let activeToolkit = null;
			let activeEngraving = null;
			let activeCurrentPage = 1; 
			let compareScoreLoaded = false;
			const compareButton = document.getElementById("compareToggle");
			const compareSection = document.getElementById("compareScoreSection");

			function createScoreViewer(scoreId, baseParam = []) {
			const tk = new verovio.toolkit();
			let currentPage = 1;
			const engraving = document.getElementById(scoreId);
			const parent = engraving.parentElement;

			function loadFile(appXPath = baseParam) {
				const meiFile = currentScene?.mei || getSceneMeiFile();

				fetch(meiFile)
					.then(response => {
						if (!response.ok) {
							throw new Error(`Could not load ${meiFile}`);
						}
						return response.text();
					})
					.then(meiData => {
						tk.setOptions({
							pageWidth: engraving.clientWidth,
							pageHeight: getVerovioPageHeight(engraving),
							adjustPageHeight: true,
							scale: 50,
							scaleToPageSize: true,
							condense: "auto",
							condenseFirstPage: true,
							appXPathQuery: appXPath
						});
						
						const annotations = extractAnnotations(meiData);
						sessionStorage.setItem(`annotations:${meiFile}`, JSON.stringify(annotations));
						console.log(annotations);

						tk.loadData(meiData);
						const barRange = getBarRange();

						if (barRange) {
							tk.select({ measureRange: barRange });
						}

						tk.redoLayout();
						const startingBar = getStartingBar();

						if (startingBar) {
							const measureId = getMeasureId(meiData, startingBar);
							const measurePage = measureId ? tk.getPageWithElement(measureId) : 0;

							if (measurePage > 0) {
								currentPage = measurePage;
							}
						} else {
							currentPage = 1;
						}

						render();
					})
					.catch(error => {
						engraving.textContent = error.message;
						console.error(error);
					});
			}
			function render() {
				const updateScore = () => {
					engraving.innerHTML = tk.renderToSVG(currentPage);
				};

				if (document.startViewTransition) {
					document.startViewTransition(updateScore);
				} else {
					updateScore();
				}
			}

			//EXTRACT ANNOTATIONS
			function extractAnnotations(meiData) {
				const MEI_NS = "http://www.music-encoding.org/ns/mei";
				const XML_NS = "http://www.w3.org/XML/1998/namespace";

				const meiDocument = new DOMParser().parseFromString(meiData, "application/xml");

				return Array.from(meiDocument.getElementsByTagNameNS(MEI_NS, "annot")).map(annot => ({
					id: annot.getAttributeNS(XML_NS, "id") || annot.getAttribute("xml:id"),
					type: annot.getAttribute("type"),
					plist: annot.getAttribute("plist"),
					text: annot.textContent.trim(),
					plistArray: getPlistArray(annot)
				}));
			}

			//SELECT PAGE RANGE
			parent.querySelector(".applySelection").addEventListener("click", () => {
				const start = parent.querySelector(".start").value || "start";
				const end = parent.querySelector(".end").value || "end";
				tk.select({ measureRange: `${start}-${end}` });
				tk.redoLayout();
				render();
			});

			//MIDI PLAYBACK
			parent.querySelector(".playMIDI")?.addEventListener("click", () => {
				activeToolkit = tk;
				activeEngraving = engraving;
				activeCurrentPage = currentPage;
				const midi = tk.renderToMIDI();
				MIDIjs.play('data:audio/midi;base64,' + midi);
			});
			parent.querySelector(".stopMIDI")?.addEventListener("click", () => {
				MIDIjs.stop();
				let playingNotes = engraving.querySelectorAll('g.note.playing');
				for (let playingNote of playingNotes) {
					playingNote.classList.remove("playing");
				}
			});

			//VERSION SELECTION
			parent.querySelector(".versionA").addEventListener("click", () => loadFile([]));
			parent.querySelector(".versionB").addEventListener("click", () => loadFile(["./rdg[@source='revised']"]));

			//SELECT PAGES
			parent.querySelector(".nextPage").addEventListener("click", () => {
				currentPage = Math.min(currentPage + 1, tk.getPageCount());
				render();
			});
			parent.querySelector(".prevPage").addEventListener("click", () => {
				currentPage = Math.max(currentPage - 1, 1);
				render();
			});
			parent.querySelectorAll(".resetPage").forEach(resetButton => {
				resetButton.addEventListener("click", () => {
					currentPage = 1;
					loadFile();
				});
			});

			loadFile();

			return {
				reload() {
					loadFile();
				},
				resize() {
					const engravingWidth = engraving.clientWidth || parent.clientWidth;

					tk.setOptions({
						pageWidth: engravingWidth,
						pageHeight: scene === "prelude" ? 100 : Math.min(engravingWidth, window.innerHeight - 200)
					});

					tk.redoLayout();
					render();
				}
			};
			}
			
			const score1Controller = createScoreViewer("score1");
			let score2Controller = null;

			compareButton.addEventListener("click", (event) => {
				event.preventDefault();

				const compareIsActive = compareButton.classList.toggle("is-active");
				compareButton.setAttribute("aria-pressed", compareIsActive);
				compareSection.hidden = !compareIsActive;
				document.body.classList.toggle("compare-active", compareIsActive);

				if (compareIsActive && !compareScoreLoaded) {
					requestAnimationFrame(() => {
						score1Controller.resize();
						score2Controller = createScoreViewer("score2");
						compareScoreLoaded = true;
					});
				}

				if (!compareIsActive) {
					document.getElementById("score2").innerHTML = "";
					compareScoreLoaded = false;

					requestAnimationFrame(() => {
						score1Controller.resize();
					});

					if (activeEngraving?.id === "score2") {
						MIDIjs.stop();
						activeToolkit = null;
						activeEngraving = null;
					}
				}
			});
			
			//MIDI HIGHLIGHTING & PAGETURNING
			const midiHighlightingHandler = function (event) {
			if (!activeToolkit || !activeEngraving) return;
			activeEngraving.querySelectorAll('g.note.playing')
				.forEach(note => note.classList.remove("playing"));
			let currentElements = activeToolkit.getElementsAtTime(event.time * 1000);
				if (currentElements.notes.length > 0) {
					let noteId = currentElements.notes[0];
					let notePage = activeToolkit.getPageWithElement(noteId);
					if (notePage > 0 && notePage !== activeCurrentPage) {
						activeCurrentPage = notePage;
						activeEngraving.innerHTML = activeToolkit.renderToSVG(activeCurrentPage);
					}
					currentElements.notes.forEach(note => {
					let noteElement = activeEngraving.querySelector(`#${note}`);
					if (noteElement) noteElement.classList.add("playing");
					});
				}
			};
			if (window.MIDIjs) {
			MIDIjs.player_callback = midiHighlightingHandler;
			}	
		};
	});