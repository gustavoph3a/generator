/**
 * Toggle Versão PH3A ↔ Versão Dinâmica (white label).
 */
(function () {
  var MODE_KEY = "ph3a_studio_mode";
  var mode = "ph3a";

  function $(id) {
    return document.getElementById(id);
  }

  function getMode() {
    return mode;
  }

  function loadMode() {
    try {
      var saved = sessionStorage.getItem(MODE_KEY);
      if (saved === "dynamic" || saved === "ph3a") mode = saved;
    } catch {
      /* ignore */
    }
  }

  function saveMode() {
    try {
      sessionStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  function updateFooterLinks() {
    var linkPh3a = $("linkStudioPh3a");
    var linkDyn = $("linkStudioDynamic");
    if (linkPh3a) linkPh3a.classList.toggle("is-active", mode === "ph3a");
    if (linkDyn) linkDyn.classList.toggle("is-active", mode === "dynamic");
  }

  function updateHeader() {
    var logo = $("studioBrandLogo");
    var suffix = $("studioBrandSuffix");
    var link = $("studioBrandLink");
    if (suffix) {
      if (mode === "dynamic") {
        if (logo) logo.hidden = true;
        suffix.textContent = "Studio Dinâmico";
        if (link) link.setAttribute("aria-label", "Studio Dinâmico — início");
      } else {
        if (logo) logo.hidden = false;
        suffix.textContent = "Studio";
        if (link) link.setAttribute("aria-label", "PH3A Studio — início");
      }
    }
    document.body.classList.toggle("studio-mode-dynamic", mode === "dynamic");
    document.body.classList.toggle("studio-mode-ph3a", mode === "ph3a");
  }

  function toggleSections() {
    var isDyn = mode === "dynamic";
    document.querySelectorAll("[data-studio-ph3a-only]").forEach(function (el) {
      el.hidden = isDyn;
    });
    document.querySelectorAll("[data-studio-dynamic-only]").forEach(function (el) {
      el.hidden = !isDyn;
    });
    var toggle = document.querySelector(".stitch-mode-toggle");
    if (toggle) toggle.hidden = isDyn;
    var hint = $("narrativeSourceHint");
    if (hint && isDyn) {
      hint.textContent = "Modo Dinâmico — OpenAI analisa a base, sugere paleta e gera narrativas white label.";
    } else if (hint && typeof updateSourceHint === "function") {
      updateSourceHint();
    }
  }

  function syncNarrativesButton() {
    var btn = $("btnNarratives");
    if (!btn) return;
    if (mode === "dynamic") {
      btn.disabled = !(window.Ph3aDynamicState && Ph3aDynamicState.isReady());
    }
  }

  function setMode(next) {
    if (next !== "ph3a" && next !== "dynamic") return;
    if (next === mode) return;
    mode = next;
    saveMode();
    updateFooterLinks();
    updateHeader();
    toggleSections();
    if (window.Ph3aApp && Ph3aApp.resetNarratives) Ph3aApp.resetNarratives();
    if (next === "ph3a" && window.Ph3aDynamicState) Ph3aDynamicState.clearAnalysis();
    if (window.Ph3aDynamicUi && Ph3aDynamicUi.onModeApplied) Ph3aDynamicUi.onModeApplied(mode);
    syncNarrativesButton();
    if (window.Ph3aKeyframesUi) Ph3aKeyframesUi.refresh();
  }

  function init() {
    loadMode();
    updateFooterLinks();
    updateHeader();
    toggleSections();

    $("linkStudioPh3a") &&
      $("linkStudioPh3a").addEventListener("click", function (e) {
        e.preventDefault();
        setMode("ph3a");
      });
    $("linkStudioDynamic") &&
      $("linkStudioDynamic").addEventListener("click", function (e) {
        e.preventDefault();
        setMode("dynamic");
      });

    syncNarrativesButton();
    if (mode === "dynamic" && window.Ph3aDynamicUi) Ph3aDynamicUi.restoreFromState();
  }

  window.Ph3aStudioMode = {
    getMode: getMode,
    setMode: setMode,
    syncNarrativesButton: syncNarrativesButton,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
