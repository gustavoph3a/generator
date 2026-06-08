/**
 * Modal de preview — textos on-screen, feição e narração (salvar manual).
 */
(function (global) {
  var previewIndex = -1;
  var formDirty = false;

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    if (typeof global.escapeHtml === "function") return global.escapeHtml(text);
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getSections(n) {
    if (typeof global.getNarrativeKfPreviewSections === "function") {
      return global.getNarrativeKfPreviewSections(n);
    }
    return [];
  }

  function getExpressionOptions() {
    if (global.Ph3aApp && typeof Ph3aApp.listKfExpressionOptions === "function") {
      return Ph3aApp.listKfExpressionOptions();
    }
    return [];
  }

  function setStatus(msg, isError) {
    var el = $("narrativePreviewNarrationStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError));
  }

  function setDirtyHint() {
    var hint = $("narrativePreviewDirtyHint");
    var saveBtn = $("btnNarrativePreviewSave");
    if (hint) hint.hidden = !formDirty;
    if (saveBtn) saveBtn.classList.toggle("is-pending", formDirty);
  }

  function markDirty() {
    formDirty = true;
    setDirtyHint();
    setStatus("", false);
  }

  function clearDirty() {
    formDirty = false;
    setDirtyHint();
  }

  function readEditsFromModal() {
    var input = $("narrativePreviewNarrationInput");
    var kfExpressions = {};
    var grid = $("narrativePreviewGrid");
    if (grid) {
      grid.querySelectorAll(".kf-preview-expression-select").forEach(function (sel) {
        var kf = parseInt(sel.getAttribute("data-kf"), 10);
        if (kf >= 1 && kf <= 4) kfExpressions[kf] = sel.value;
      });
    }
    return {
      narration: input ? input.value : "",
      kfExpressions: kfExpressions,
    };
  }

  function saveFromModal() {
    if (previewIndex < 0) return false;
    if (!global.Ph3aApp || typeof Ph3aApp.saveNarrativePreviewEdits !== "function") {
      setStatus("Não foi possível salvar.", true);
      return false;
    }
    var ok = Ph3aApp.saveNarrativePreviewEdits(previewIndex, readEditsFromModal());
    if (ok) {
      clearDirty();
      setStatus("Salvo nesta narrativa. Se ela estiver selecionada, keyframes e roteiros já usam os dados novos.");
      window.setTimeout(function () {
        if (!formDirty) setStatus("", false);
      }, 4000);
    } else {
      setStatus("Não foi possível salvar.", true);
    }
    return ok;
  }

  function confirmDiscard(message, onProceed) {
    if (!formDirty) {
      onProceed();
      return;
    }
    if (window.confirm(message)) {
      clearDirty();
      onProceed();
    }
  }

  function renderExpressionSelect(sec) {
    var options = getExpressionOptions();
    if (!options.length) return "";
    var selected = sec.expressionId || "";
    var opts = options
      .map(function (o) {
        var sel = o.id === selected ? " selected" : "";
        return (
          '<option value="' +
          escapeHtml(o.id) +
          '"' +
          sel +
          ">" +
          escapeHtml(o.label) +
          "</option>"
        );
      })
      .join("");
    return (
      '<div class="kf-preview-expression">' +
      '<label class="kf-preview-label" for="kf-expr-' +
      sec.num +
      '">Feição do avatar</label>' +
      '<select id="kf-expr-' +
      sec.num +
      '" class="kf-preview-expression-select" data-kf="' +
      sec.num +
      '" aria-label="Feição keyframe ' +
      sec.num +
      '">' +
      opts +
      "</select></div>"
    );
  }

  function renderField(label, value) {
    if (!value) return "";
    return (
      '<div class="kf-preview-field">' +
      '<span class="kf-preview-label">' +
      escapeHtml(label) +
      "</span>" +
      '<p class="kf-preview-value">' +
      escapeHtml(value) +
      "</p></div>"
    );
  }

  function renderSection(sec) {
    var fieldsHtml = (sec.fields || []).map(function (f) {
      return renderField(f.label, f.value);
    }).join("");

    var listHtml = "";
    if (sec.list && sec.list.length) {
      listHtml =
        '<ol class="kf-preview-list">' +
        sec.list
          .map(function (item) {
            return (
              '<li><span class="kf-preview-list-n">' +
              escapeHtml(item.label) +
              '.</span> <span class="kf-preview-value">' +
              escapeHtml(item.value) +
              "</span></li>"
            );
          })
          .join("") +
        "</ol>";
    }

    var visualHtml = sec.visual
      ? '<p class="kf-preview-visual hint"><span class="material-symbols-outlined kf-preview-visual-icon" aria-hidden="true">palette</span> ' +
        escapeHtml(sec.visual) +
        "</p>"
      : "";

    return (
      '<article class="kf-preview-card" data-kf="' +
      sec.num +
      '">' +
      '<header class="kf-preview-card-head">' +
      '<span class="kf-preview-badge">KF' +
      sec.num +
      "</span>" +
      '<div><h3 class="kf-preview-card-title">' +
      escapeHtml(sec.role) +
      '</h3><span class="kf-preview-timing">' +
      escapeHtml(sec.timing) +
      "</span></div>" +
      "</header>" +
      '<div class="kf-preview-card-body">' +
      renderExpressionSelect(sec) +
      fieldsHtml +
      listHtml +
      visualHtml +
      "</div></article>"
    );
  }

  function bindExpressionSelects() {
    var grid = $("narrativePreviewGrid");
    if (!grid || grid._kfExprBound) return;
    grid._kfExprBound = true;
    grid.addEventListener("change", function (e) {
      if (e.target.classList.contains("kf-preview-expression-select")) markDirty();
    });
  }

  function renderGrid(n) {
    var grid = $("narrativePreviewGrid");
    if (!grid) return;
    var sections = getSections(n);
    grid.innerHTML = sections.map(renderSection).join("");
    bindExpressionSelects();

    var input = $("narrativePreviewNarrationInput");
    if (input) input.value = n.narration || "";
    clearDirty();
    setStatus("", false);
  }

  function closeModal(force) {
    function doClose() {
      var modal = $("narrativePreviewModal");
      if (modal) modal.hidden = true;
      previewIndex = -1;
      clearDirty();
      setStatus("", false);
    }
    if (force) {
      doClose();
      return;
    }
    confirmDiscard(
      "Descartar alterações não salvas nesta narrativa?",
      doClose
    );
  }

  function getNarrative(index) {
    if (global.Ph3aApp && typeof Ph3aApp.getNarrativeAt === "function") {
      return Ph3aApp.getNarrativeAt(index);
    }
    return null;
  }

  function open(index) {
    function showIndex() {
      var n = getNarrative(index);
      if (!n) return;

      previewIndex = index;
      var modal = $("narrativePreviewModal");
      if (!modal) return;

      var sub = $("narrativePreviewSubtitle");
      if (sub) {
        sub.textContent =
          (index + 1) +
          ". " +
          (n.label || "Narrativa") +
          (n.productDisplay ? " · " + n.productDisplay : "");
      }

      renderGrid(n);
      modal.hidden = false;
    }

    if (previewIndex >= 0 && previewIndex !== index && formDirty) {
      confirmDiscard(
        "Descartar alterações da narrativa aberta e ver outra?",
        showIndex
      );
      return;
    }
    showIndex();
  }

  function selectFromPreview() {
    if (previewIndex < 0) return;
    function doSelect() {
      if (global.Ph3aApp && typeof Ph3aApp.selectNarrative === "function") {
        Ph3aApp.selectNarrative(previewIndex);
      }
      closeModal(true);
    }
    if (formDirty) {
      confirmDiscard(
        "Alterações não salvas serão descartadas. Usar esta narrativa mesmo assim? (Salve antes se quiser manter feição e narração editadas.)",
        doSelect
      );
      return;
    }
    doSelect();
  }

  function init() {
    $("btnCloseNarrativePreview")?.addEventListener("click", function () {
      closeModal(false);
    });
    $("btnCloseNarrativePreviewFooter")?.addEventListener("click", function () {
      closeModal(false);
    });
    $("btnNarrativePreviewSave")?.addEventListener("click", saveFromModal);
    $("btnNarrativePreviewSelect")?.addEventListener("click", selectFromPreview);

    var input = $("narrativePreviewNarrationInput");
    if (input) input.addEventListener("input", markDirty);

    $("narrativePreviewModal")?.addEventListener("click", function (e) {
      if (e.target.id === "narrativePreviewModal") closeModal(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && $("narrativePreviewModal") && !$("narrativePreviewModal").hidden) {
        closeModal(false);
      }
    });
  }

  global.Ph3aNarrativePreview = { open: open, close: closeModal };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
