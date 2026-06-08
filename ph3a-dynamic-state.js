/**
 * Estado do modo Dynamic (white label) — base analisada, paleta, hints visuais.
 */
(function (global) {
  var STORAGE_KEY = "ph3a_dynamic_ctx";

  var state = {
    ready: false,
    baseText: "",
    productName: "",
    tagline: "",
    brandKnown: false,
    brandName: "",
    industry: "",
    tone: "",
    visualHints: null,
    palettes: [],
    selectedPaletteId: null,
  };

  function loadFromStorage() {
    try {
      var raw = global.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        state = Object.assign(state, parsed);
      }
    } catch {
      /* ignore */
    }
  }

  function saveToStorage() {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }

  function getSelectedPalette() {
    if (!state.palettes || !state.palettes.length) return null;
    var id = state.selectedPaletteId || state.palettes[0].id;
    for (var i = 0; i < state.palettes.length; i++) {
      if (state.palettes[i].id === id) return state.palettes[i];
    }
    return state.palettes[0];
  }

  function setAnalysisResult(baseText, data) {
    state.ready = true;
    state.baseText = baseText || "";
    state.productName = data.productName || "PRODUTO";
    state.tagline = data.tagline || "";
    state.brandKnown = Boolean(data.brandKnown);
    state.brandName = data.brandName || "";
    state.industry = data.industry || "";
    state.tone = data.tone || "";
    state.visualHints = data.visualHints || null;
    state.palettes = Array.isArray(data.palettes) ? data.palettes.slice(0, 2) : [];
    state.selectedPaletteId = state.palettes[0] ? state.palettes[0].id : null;
    saveToStorage();
  }

  function clearAnalysis() {
    state.ready = false;
    state.baseText = "";
    state.productName = "";
    state.tagline = "";
    state.brandKnown = false;
    state.brandName = "";
    state.industry = "";
    state.tone = "";
    state.visualHints = null;
    state.palettes = [];
    state.selectedPaletteId = null;
    try {
      global.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function selectPalette(id) {
    state.selectedPaletteId = id;
    saveToStorage();
  }

  loadFromStorage();

  global.Ph3aDynamicState = {
    isReady: function () {
      return state.ready;
    },
    get: function () {
      return state;
    },
    getSelectedPalette: getSelectedPalette,
    setAnalysisResult: setAnalysisResult,
    clearAnalysis: clearAnalysis,
    selectPalette: selectPalette,
  };
})(typeof window !== "undefined" ? window : globalThis);
