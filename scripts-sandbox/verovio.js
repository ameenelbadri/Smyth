	document.addEventListener("DOMContentLoaded", (event) => {
		verovio.module.onRuntimeInitialized = function () {
			
			let activeToolkit = null;
			let activeEngraving = null;
			let activeCurrentPage = 1; 
			let compareScoreLoaded = false;
			const compareButton = document.getElementById("compareToggle");
			const compareSection = document.getElementById("compareScoreSection");

			const revisionMap = new Map([
				["jcp5mj1", "h1qtzu3p"],
				["c4nbw0y", "c8g5cv1"],
				["o1kqbmx1", "opptvl1"],
				["a1o61lli", "a8f32d8"],
				["m3tvclh", "mu46ehk"],
				["b1q00lkw", "c109ui1v"],
				["ozd1cbo", "o9vqorv"],
				["a1sslnyu", "m4utyoz"],
				["mmpelki", "yd59zmm"],
				["y1xuyafa", "yd59zmm"],
				["kdlptk", "x12zzmte"],
				["x3fny0e", "j17ysn9q"],
				["jkzmev", "v7p0ft0"],
				["em6ow1l", "md48w86"],
				["q1tf0oea", "byakmkw"],
				["o2y7b4u", "nqhntm"],
				["d19z87f7", "a1aqsaoz"],
				["p1wm60gp", "m179cfx5"],
				["p1wm60gp", "yoirjxl"],
				["d394j7a", "k864bjd"],
				["qkf4nyp", "wx16fpn"],
				["j1qh6ot3", "s142rq6r"],
				["l9w3jjg", "tsilbbi"],
				["a1dp6gt1", "p18osycq"],
				["mjwwb7k", "l1wo9dcv"],
				["bxjq5e0", "m1nu0ubq"],
				["jtl1kup", "o1mdagem"],
				["z12iixsn", "jpoqx5x"],
				["tqsovv4", "jmhcb73"],
				["f1qf996m", "piofbe7"],
				["yuy9w7h", "s6yk8ot"],
				["v1qe2as2", "w1ejsulf"],
				["oqaed9l", "qrcybh5"],
				["p2s3iem", "pn44toa"],
				["r14uyuod", "vepvaqb"],
				["dcandwg", "hjt3pao"],
				["g1j9ybs8", "ms8otg7"],
				["uw0d1hi", "d1rr425f"],
				["iadc53u", "r1gwqsld"],
				["g1fxmucv", "v15yxbey"],
				["l1kac9r1", "cvpdwmv"],
				["nbknonm", "eaizjm4"],
				["q1e5avfd", "njesexx"],
				["l4rikf1", "jpl6gfu"],
				["dasiwe3", "a164avut"],
				["v8uj4of", "s1ccv8fl"],
				["wat5go3", "cgq3cxq"],
				["rs2h2lh", "wsu4tt0"],
				["ebc944l", "l1mcqj8l"],
				["r1c3my5", "w1wvppdb"],
				["m1x9kbq1", "sinmqr4"],
			]);

			function createScoreViewer(scoreId, {
				filePath = null,
				breaks = "auto",
				appXPath = [],
				autoLoad = true
			} = {}) {
				const tk = new verovio.toolkit();
				let currentPage = 1;
				const engraving = document.getElementById(scoreId);
				const parent = engraving.parentElement;

				function loadFile(meiText = null, requestedFilePath = filePath) {
					tk.setOptions({
						pageWidth: engraving.clientWidth,
						pageHeight: getVerovioPageHeight(engraving),
						adjustPageHeight: true,
						scale: 50,
						scaleToPageSize: true,
						condense: "auto",
						condenseFirstPage: true,
						breaks,
						appXPathQuery: appXPath
					});

					const meiPromise = meiText
						? Promise.resolve(meiText)
						: fetch(requestedFilePath || currentScene?.mei || getSceneMeiFile())
							.then(response => {
								if (!response.ok) {
									throw new Error(`Could not load ${requestedFilePath}`);
								}
								return response.text();
							});

					return meiPromise
						.then(data => {
							const annotations = extractAnnotations(data);
							sessionStorage.setItem(
								`annotations:${requestedFilePath || filePath || currentScene?.mei || getSceneMeiFile()}`,
								JSON.stringify(annotations)
							);
							tk.loadData(data);
							tk.redoLayout();
							render();
							return data;
						})
						.catch(error => {
							engraving.textContent = error.message;
							console.error(error);
							throw error;
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
			parent.querySelector(".versionA").addEventListener("click", () =>
				loadFile(null, "../mei/TEST-ORIGINAL.mei")
			);
			parent.querySelector(".versionB").addEventListener("click", () =>
				loadFile(null, "../mei/TEST-REVISED.mei")
			);

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

			if (autoLoad) {
				loadFile();
			}

			return {
				loadFile,
				getToolkit: () => tk,
				reload() {
					loadFile();
				},
				resize() {
					const engravingWidth = engraving.clientWidth || parent.clientWidth;

					tk.setOptions({
						pageWidth: engravingWidth,
						pageHeight: scene === "prelude" ? 100 : Math.min(engravingWidth, window.innerHeight - 200),
						adjustPageHeight: true
					});

					tk.redoLayout();
					render();
				}
			};
			}
			
			const score1Controller = createScoreViewer("score1", {
				filePath: "../mei/TEST-ORIGINAL.mei",
				breaks: "auto"
			});

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
						score2Controller = createScoreViewer("score2", {
							filePath: "../mei/TEST-REVISED.mei",
							breaks: "encoded",
							autoLoad: false
						});
						renderResponsiveComparison().catch(error => {
							document.getElementById("score2").textContent = error.message;
						});
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
			
			//ANCHOR POINTS
			function getAnchorsFromVersionA(tk) {
				const starts = [];

				for (let page = 1; page <= tk.getPageCount(); page++) {
					const holder = document.createElement("div");
					holder.innerHTML = tk.renderToSVG(page);

					holder.querySelectorAll("g.system").forEach((system, systemIndex) => {
						const firstMeasure = system.querySelector("g.measure[id]");

						if (!firstMeasure) return;

						starts.push({
							originalMeasureId: firstMeasure.id,
							beginsPage: systemIndex === 0
						});
					});
				}

				return starts;
			}

			function mapAnchorsToVersionB(versionAStarts) {
				return versionAStarts
					.map(({ originalMeasureId, beginsPage }) => {
						const revisedMeasureId = revisionMap.get(originalMeasureId);

						if (!revisedMeasureId) {
							console.warn(
								`No Version B anchor for Version A measure ${originalMeasureId}`
							);
							return null;
						}

						return {
							revisedMeasureId,
							beginsPage
						};
					})
					.filter(Boolean);
			}

			function insertResponsiveBreaks(revisedMeiText, versionBBreaks) {
				const meiNamespace = "http://www.music-encoding.org/ns/mei";
				const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

				const documentXml = new DOMParser().parseFromString(
					revisedMeiText,
					"application/xml"
				);

				const existingBreaks = [
					...documentXml.getElementsByTagNameNS(meiNamespace, "pb"),
					...documentXml.getElementsByTagNameNS(meiNamespace, "sb")
				];
				existingBreaks.forEach(breakElement => breakElement.remove());

				versionBBreaks.slice(1).forEach(({ revisedMeasureId, beginsPage }, index) => {
					const anchor = documentXml.evaluate(
						`//*[@xml:id="${revisedMeasureId}"]`,
						documentXml,
						prefix => prefix === "xml" ? xmlNamespace : null,
						XPathResult.FIRST_ORDERED_NODE_TYPE,
						null
					).singleNodeValue;

					if (!anchor) {
						console.warn(`Could not find revised anchor ${revisedMeasureId}`);
						return;
					}

					const breakElement = documentXml.createElementNS(
						meiNamespace,
						beginsPage ? "pb" : "sb"
					);

					breakElement.setAttribute("xml:id", `responsive-break-${index}`);
					anchor.parentNode.insertBefore(breakElement, anchor);
				});

				return new XMLSerializer().serializeToString(documentXml);
			}

			async function renderResponsiveComparison() {
				await score1Controller.loadFile(null, "../mei/TEST-ORIGINAL.mei");

				const startsA = getAnchorsFromVersionA(
					score1Controller.getToolkit()
				);
				const breaksB = mapAnchorsToVersionB(startsA);

				const response = await fetch("../mei/TEST-REVISED.mei");
				if (!response.ok) {
					throw new Error("Could not load ../mei/TEST-REVISED.mei");
				}

				const revisedMeiText = await response.text();
				const responsiveRevisedMei = insertResponsiveBreaks(
					revisedMeiText,
					breaksB
				);

				await score2Controller.loadFile(responsiveRevisedMei);
			}

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
