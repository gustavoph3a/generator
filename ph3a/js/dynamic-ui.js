/**
 * UI — modo Dynamic: Carregar base, paletas sugeridas, fluxo white label.
 */
(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(msg, isError) {
    var el = $("dynamicBaseStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError && msg));
  }

  function getOpenAiKey() {
    var fromInput = $("openaiApiKey") && $("openaiApiKey").value.trim();
    if (fromInput) return fromInput;
    if (window.Ph3aOpenAI) return Ph3aOpenAI.loadOpenAiKey();
    if (typeof window.PH3A_OPENAI_KEY_DEFAULT === "string") return window.PH3A_OPENAI_KEY_DEFAULT;
    return "";
  }

  function renderBrandSummary(data) {
    var box = $("dynamicBrandSummary");
    if (!box) return;
    var lines = [];
    if (data.brandKnown && data.brandName) {
      lines.push("Marca reconhecida: " + data.brandName);
    } else {
      lines.push("Marca: custom / não reconhecida automaticamente");
    }
    if (data.industry) lines.push("Setor: " + data.industry);
    if (data.tone) lines.push("Tom: " + data.tone);
    box.textContent = lines.join(" · ");
    box.hidden = false;
  }

  function renderPalettePicker(palettes, selectedId) {
    var grid = $("dynamicPaletteGrid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!palettes || !palettes.length) {
      $("dynamicPalettePicker").hidden = true;
      return;
    }
    $("dynamicPalettePicker").hidden = false;
    palettes.forEach(function (p) {
      var label = document.createElement("label");
      label.className = "dynamic-palette-card";
      if (p.id === selectedId) label.classList.add("is-selected");
      label.innerHTML =
        '<input type="radio" name="dynamicPalette" value="' +
        p.id +
        '" class="sr-only"' +
        (p.id === selectedId ? " checked" : "") +
        " />" +
        '<span class="dynamic-palette-swatches">' +
        '<span class="dynamic-swatch" style="background:' +
        p.primary +
        '" title="Primária"></span>' +
        '<span class="dynamic-swatch" style="background:' +
        p.accent +
        '" title="Acento"></span>' +
        '<span class="dynamic-swatch" style="background:' +
        p.text +
        '" title="Claros"></span>' +
        "</span>" +
        '<span class="dynamic-palette-label">' +
        p.label +
        "</span>" +
        (p.notes ? '<span class="dynamic-palette-notes">' + p.notes + "</span>" : "");
      label.querySelector('input[name="dynamicPalette"]').addEventListener("change", function () {
        if (window.Ph3aDynamicState) Ph3aDynamicState.selectPalette(p.id);
        document.querySelectorAll(".dynamic-palette-card").forEach(function (c) {
          c.classList.remove("is-selected");
        });
        label.classList.add("is-selected");
      });
      grid.appendChild(label);
    });
  }

  function applyAnalysisToForm(data) {
    if ($("productName")) $("productName").value = data.productName || "";
    if ($("tagline")) $("tagline").value = data.tagline || "";
    renderBrandSummary(data);
    renderPalettePicker(data.palettes, data.palettes[0] ? data.palettes[0].id : null);
  }

  function restoreFromState() {
    if (!window.Ph3aStudioMode || Ph3aStudioMode.getMode() !== "dynamic") return;
    if (!window.Ph3aDynamicState || !Ph3aDynamicState.isReady()) {
      setStatus("Cole a base do cliente e clique em «Carregar base».");
      if (window.Ph3aStudioMode.syncNarrativesButton) Ph3aStudioMode.syncNarrativesButton();
      return;
    }
    var data = Ph3aDynamicState.get();
    applyAnalysisToForm(data);
    setStatus(
      "Base carregada — «" +
        data.productName +
        "». Escolha a paleta (se houver) e clique em «Gerar 5 narrativas»."
    );
    if (window.Ph3aStudioMode.syncNarrativesButton) Ph3aStudioMode.syncNarrativesButton();
  }

  function onAnalyzeBase() {
    var text = $("baseText") && $("baseText").value.trim();
    if (!text || text.length < 80) {
      alert("Cole ou envie a base (mínimo ~80 caracteres).");
      return;
    }
    var key = getOpenAiKey();
    if (!key) {
      alert("Configure a chave OpenAI (sk-…) em Configurações — o modo Dinâmico usa ChatGPT.");
      return;
    }
    if (!window.Ph3aDynamicApi) {
      alert("dynamic-api não carregou.");
      return;
    }
    var btn = $("btnAnalyzeBase");
    if (btn) btn.disabled = true;
    setStatus("Analisando base com IA (marca, paleta, metáforas visuais)…");
    $("dynamicBrandSummary").hidden = true;
    $("dynamicPalettePicker").hidden = true;
    if (window.Ph3aApp && Ph3aApp.resetNarratives) Ph3aApp.resetNarratives();

    Ph3aDynamicApi.analyzeClientBase(key, text)
      .then(function (data) {
        Ph3aDynamicState.setAnalysisResult(text, data);
        applyAnalysisToForm(data);
        setStatus(
          (data.brandKnown
            ? "Marca «" + data.brandName + "» reconhecida — "
            : "Base analisada — ") + "paleta sugerida. Revise produto/tagline e gere as 5 narrativas."
        );
        if (window.Ph3aStudioMode && Ph3aStudioMode.syncNarrativesButton) {
          Ph3aStudioMode.syncNarrativesButton();
        }
        if (window.Ph3aOpenAI) Ph3aOpenAI.saveOpenAiKey(key);
      })
      .catch(function (e) {
        setStatus(e.message || String(e), true);
        if (window.Ph3aDynamicState) Ph3aDynamicState.clearAnalysis();
        if (window.Ph3aStudioMode && Ph3aStudioMode.syncNarrativesButton) {
          Ph3aStudioMode.syncNarrativesButton();
        }
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function onModeApplied(mode) {
    if (mode === "dynamic") {
      setStatus("Cole a base do cliente e clique em «Carregar base».");
      $("dynamicBrandSummary").hidden = true;
      $("dynamicPalettePicker").hidden = true;
    } else {
      setStatus("");
      closeBaseExampleModal();
    }
  }

  var baseExampleLoaded = null;

  function loadBaseExampleText() {
    if (baseExampleLoaded) return Promise.resolve(baseExampleLoaded);
    return fetch("examples/uber-base.txt")
      .then(function (res) {
        if (!res.ok) throw new Error("Exemplo não encontrado.");
        return res.text();
      })
      .then(function (text) {
        baseExampleLoaded = text;
        return text;
      });
  }

  function openBaseExampleModal() {
    var modal = $("baseExampleModal");
    var ta = $("baseExampleText");
    var status = $("baseExampleCopyStatus");
    if (!modal || !ta) return;
    if (status) status.textContent = "";
    modal.hidden = false;
    ta.value = "Carregando exemplo…";
    loadBaseExampleText()
      .then(function (text) {
        ta.value = text;
      })
      .catch(function (e) {
        ta.value = "";
        if (status) status.textContent = e.message || String(e);
      });
  }

  function closeBaseExampleModal() {
    var modal = $("baseExampleModal");
    if (modal) modal.hidden = true;
  }

  function useBaseExampleInField() {
    var ta = $("baseExampleText");
    var target = $("baseText");
    if (!ta || !target || !ta.value.trim()) return;
    target.value = ta.value;
    closeBaseExampleModal();
    if (window.Ph3aDynamicState && Ph3aDynamicState.isReady()) {
      Ph3aDynamicState.clearAnalysis();
      $("dynamicBrandSummary").hidden = true;
      $("dynamicPalettePicker").hidden = true;
      if (window.Ph3aStudioMode && Ph3aStudioMode.syncNarrativesButton) {
        Ph3aStudioMode.syncNarrativesButton();
      }
    }
    setStatus("Exemplo colado — clique em «Carregar base» para a IA analisar.");
    target.focus();
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function initBaseExampleModal() {
    $("btnBaseExample") &&
      $("btnBaseExample").addEventListener("click", function () {
        openBaseExampleModal();
      });
    $("btnCloseBaseExample") &&
      $("btnCloseBaseExample").addEventListener("click", function () {
        closeBaseExampleModal();
      });
    $("baseExampleModal") &&
      $("baseExampleModal").addEventListener("click", function (e) {
        if (e.target === $("baseExampleModal")) closeBaseExampleModal();
      });
    $("btnUseBaseExample") &&
      $("btnUseBaseExample").addEventListener("click", function () {
        useBaseExampleInField();
      });
    $("btnCopyBaseExample") &&
      $("btnCopyBaseExample").addEventListener("click", function () {
        var ta = $("baseExampleText");
        var status = $("baseExampleCopyStatus");
        if (!ta || !ta.value) return;
        navigator.clipboard.writeText(ta.value).then(
          function () {
            if (status) status.textContent = "Copiado para a área de transferência.";
          },
          function () {
            if (status) status.textContent = "Selecione o texto e use Ctrl+C.";
          }
        );
      });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("baseExampleModal") && !$("baseExampleModal").hidden) {
        closeBaseExampleModal();
      }
    });
  }

  function init() {
    initBaseExampleModal();
    $("btnAnalyzeBase") &&
      $("btnAnalyzeBase").addEventListener("click", function () {
        onAnalyzeBase();
      });
    $("baseText") &&
      $("baseText").addEventListener("input", function () {
        if (
          window.Ph3aStudioMode &&
          Ph3aStudioMode.getMode() === "dynamic" &&
          window.Ph3aDynamicState &&
          Ph3aDynamicState.isReady()
        ) {
          var current = Ph3aDynamicState.get().baseText;
          if ($("baseText").value.trim() !== current) {
            Ph3aDynamicState.clearAnalysis();
            $("dynamicBrandSummary").hidden = true;
            $("dynamicPalettePicker").hidden = true;
            setStatus("Base alterada — clique em «Carregar base» de novo.");
            if (window.Ph3aStudioMode.syncNarrativesButton) Ph3aStudioMode.syncNarrativesButton();
          }
        }
      });
  }

  window.Ph3aDynamicUi = {
    init: init,
    restoreFromState: restoreFromState,
    onModeApplied: onModeApplied,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
