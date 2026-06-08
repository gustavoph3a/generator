/**
 * UI — avatar.html (refs, paleta, 2D/3D, gerar A/B, saída de profile).
 */
(function () {
  var $ = function (id) {
    return document.getElementById(id);
  };

  var refFiles = [];
  var initialized = false;
  var apiDebugLog = "";
  var state = {
    generating: false,
    ctx: null,
    images: { a: null, b: null },
    chosen: null,
  };

  function getKey() {
    var fromInput = $("openaiApiKey") && $("openaiApiKey").value.trim();
    if (fromInput) return fromInput;
    if (window.Ph3aOpenAI) return Ph3aOpenAI.loadOpenAiKey();
    if (typeof window.PH3A_OPENAI_KEY_DEFAULT === "string") return window.PH3A_OPENAI_KEY_DEFAULT;
    return "";
  }

  function setStatus(msg, isError) {
    var el = $("avatarStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError && msg));
  }

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () {
        resolve(r.result);
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  function addRefFromBlob(blob, name) {
    if (!blob.type || blob.type.indexOf("image/") !== 0) return Promise.resolve(false);
    if (refFiles.length >= 6) return Promise.resolve(false);
    return readFileAsDataUrl(new File([blob], name || "ref.png", { type: blob.type })).then(function (dataUrl) {
      refFiles.push({ name: name || "ref.png", dataUrl: dataUrl });
      renderRefThumbs();
      setStatus(refFiles.length + " referência(s) prontas. Clique em «Gerar avatar» quando quiser.");
      return true;
    });
  }

  function renderRefThumbs() {
    var box = $("avatarRefThumbs");
    if (!box) return;
    box.innerHTML = "";
    refFiles.forEach(function (item, i) {
      var wrap = document.createElement("div");
      wrap.className = "mascot-thumb";
      var img = document.createElement("img");
      img.src = item.dataUrl;
      img.alt = item.name;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "mascot-thumb-remove";
      rm.textContent = "×";
      rm.title = "Remover";
      rm.addEventListener("click", function () {
        refFiles.splice(i, 1);
        renderRefThumbs();
        if (!refFiles.length) setStatus("Anexe ou cole imagens de referência.");
      });
      wrap.appendChild(img);
      wrap.appendChild(rm);
      box.appendChild(wrap);
    });
    $("btnGenerateAvatar").disabled = state.generating || !refFiles.length || !getKey();
  }

  function getOptions() {
    var paletteMode = document.querySelector('input[name="paletteMode"]:checked');
    var renderMode = document.querySelector('input[name="renderMode"]:checked');
    var avatarKind = document.querySelector('input[name="avatarKind"]:checked');
    return {
      paletteMode: paletteMode ? paletteMode.value : "ph3a",
      colorPrimary: ($("colorPrimary") && $("colorPrimary").value) || "#1a1a1a",
      colorAccent: ($("colorAccent") && $("colorAccent").value) || "#E94E1B",
      colorText: ($("colorText") && $("colorText").value) || "#F5F1EA",
      paletteNotes: ($("paletteNotes") && $("paletteNotes").value.trim()) || "",
      renderMode: renderMode ? renderMode.value : "2d",
      avatarKind: avatarKind && avatarKind.value === "human" ? "human" : "abstract",
    };
  }

  function toggleCustomPalette() {
    var custom = $("paletteCustomFields");
    var isCustom = document.querySelector('input[name="paletteMode"]:checked');
    if (custom) custom.hidden = !isCustom || isCustom.value !== "custom";
  }

  function setVariantSlot(variant, slotState, dataUrl) {
    var slot = document.querySelector('.avatar-variant-slot[data-variant="' + variant + '"]');
    if (!slot) return;
    slot.classList.remove("is-idle", "is-loading", "is-error", "has-image", "is-selected");
    slot.classList.add(slotState);
    var img = slot.querySelector(".avatar-variant-img");
    var dl = slot.querySelector(".avatar-variant-download");
    var pick = slot.querySelector(".avatar-variant-pick");
    if (slotState === "has-image" && dataUrl) {
      if (img) img.src = dataUrl;
      if (dl) {
        dl.hidden = false;
        dl.onclick = function () {
          downloadDataUrl(dataUrl, "avatar_variante_" + variant.toLowerCase() + ".png");
        };
      }
      if (pick) pick.disabled = false;
    } else {
      if (img) img.removeAttribute("src");
      if (dl) dl.hidden = true;
      if (pick) pick.disabled = slotState !== "has-image";
    }
    if (state.chosen === variant) slot.classList.add("is-selected");
  }

  function downloadDataUrl(dataUrl, filename) {
    var a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function setApiDebug(text) {
    apiDebugLog = text || "";
    var ta = $("avatarApiDebugText");
    if (ta) ta.value = apiDebugLog;
  }

  function appendApiDebug(block) {
    setApiDebug((apiDebugLog ? apiDebugLog + "\n\n" : "") + block);
  }

  function toggleDebugPanel(forceOpen) {
    var body = $("avatarDebugBody");
    var btn = $("avatarDebugToggle");
    var chevron = $("avatarDebugChevron");
    if (!body) return;

    var isOpen;
    if (typeof forceOpen === "boolean") {
      isOpen = forceOpen;
      body.classList.toggle("hidden", !isOpen);
    } else {
      isOpen = body.classList.contains("hidden");
      body.classList.toggle("hidden");
      isOpen = !isOpen;
    }
    if (btn) btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    if (chevron) chevron.style.transform = isOpen ? "rotate(180deg)" : "";
  }

  function setDebugTab(tabId) {
    document.querySelectorAll(".avatar-debug-tab").forEach(function (btn) {
      var active = btn.getAttribute("data-debug-tab") === tabId;
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("text-on-surface-variant", !active);
    });
    document.querySelectorAll("[data-debug-panel]").forEach(function (panel) {
      panel.classList.toggle("hidden", panel.getAttribute("data-debug-panel") !== tabId);
    });
  }

  function logAnalyzeDebug(ctx) {
    if (!ctx || !ctx._apiDebug) return;
    var d = ctx._apiDebug;
    appendApiDebug(
      "── " +
        d.model +
        " · análise de refs (visão) ──\n\n" +
        "PROMPT ENVIADO:\n" +
        d.prompt +
        "\n\nRESPOSTA BRUTA:\n" +
        d.rawContent
    );
    delete ctx._apiDebug;
  }

  function logVariantDebug(ctx, variant, ok, errMsg) {
    if (!Ph3aAvatarApi.buildVariantImagePrompt) return;
    var prompt = Ph3aAvatarApi.buildVariantImagePrompt(ctx, variant);
    appendApiDebug(
      "── images/edits · Variante " +
        variant +
        " ──\n\n" +
        "PROMPT ENVIADO:\n" +
        prompt +
        "\n\n" +
        (ok ? "RESULTADO: PNG gerado com sucesso." : "ERRO: " + (errMsg || "falhou"))
    );
  }

  function updateOutput() {
    var ta = $("avatarOutputText");
    if (!ta || !state.ctx) return;
    ta.value = Ph3aAvatarApi.buildUsageOutput(state.ctx, state.chosen);
  }

  function chooseVariant(variant) {
    if (!state.images[variant.toLowerCase()]) return;
    state.chosen = variant;
    document.querySelectorAll(".avatar-variant-slot").forEach(function (slot) {
      slot.classList.remove("is-selected");
    });
    var sel = document.querySelector('.avatar-variant-slot[data-variant="' + variant + '"]');
    if (sel) sel.classList.add("is-selected");
    updateOutput();
    var imgUrl = state.images[variant.toLowerCase()];
    var outText = $("avatarOutputText") ? $("avatarOutputText").value : "";
    if (state.ctx && !state.ctx.presetId && window.Ph3aAvatarPresets) {
      Ph3aAvatarPresets.clearSelection();
      var presetStatus = $("avatarPickerV2Status");
      if (presetStatus) presetStatus.textContent = "";
    }
    if (window.Ph3aAvatarState && state.ctx && imgUrl) {
      Ph3aAvatarState.saveCustomAvatar(state.ctx, variant, imgUrl, outText);
    } else {
      try {
        localStorage.setItem("ph3a_avatar_profile_json", JSON.stringify(state.ctx));
        localStorage.setItem("ph3a_avatar_chosen", variant);
        localStorage.setItem("ph3a_avatar_output_text", outText);
      } catch {
        /* ignore */
      }
    }
    setStatus("Variante " + variant + " selecionada — avatar personalizado ativo nos keyframes.");
  }

  function syncOptionsFromCtx(ctx) {
    if (!ctx) return;
    if (ctx.palette && ctx.palette.id === "ph3a") {
      var ph3a = document.querySelector('input[name="paletteMode"][value="ph3a"]');
      if (ph3a) ph3a.checked = true;
    }
    if (ctx.renderMode) {
      var rm = document.querySelector('input[name="renderMode"][value="' + ctx.renderMode + '"]');
      if (rm) rm.checked = true;
      syncRenderModeCards();
    }
    if (ctx.avatarKind) {
      var ak = document.querySelector('input[name="avatarKind"][value="' + ctx.avatarKind + '"]');
      if (ak) ak.checked = true;
      syncAvatarKindCards();
    }
    toggleCustomPalette();
  }

  function clearCreationVariants() {
    state.images = { a: null, b: null };
    state.chosen = null;
    state.ctx = null;
    ["A", "B"].forEach(function (v) {
      setVariantSlot(v, "is-idle", null);
    });
    document.querySelectorAll(".avatar-variant-slot").forEach(function (slot) {
      slot.classList.remove("is-selected");
    });
  }

  function clearDebugOutput() {
    if ($("avatarOutputText")) $("avatarOutputText").value = "";
    setApiDebug("");
  }

  function resetVariants() {
    if (window.Ph3aAvatarPresets) Ph3aAvatarPresets.clearSelection();
    var presetStatus = $("avatarPickerV2Status");
    if (presetStatus) presetStatus.textContent = "";
    clearCreationVariants();
    clearDebugOutput();
  }

  /** Avatar ativo fica no localStorage (Keyframes); a grade A/B só mostra geração desta sessão. */
  function hintSavedCustomAvatar() {
    if (!window.Ph3aAvatarState) return false;
    var ctx = Ph3aAvatarState.getProfileCtx();
    if (!ctx || ctx.presetId || Ph3aAvatarState.getMode() !== "custom") return false;
    if (!Ph3aAvatarState.getChosenImageDataUrl()) return false;
    var name = (ctx.profile && ctx.profile.name) || "avatar";
    var v = Ph3aAvatarState.getChosenVariant() || "A";
    setStatus(
      "Avatar «" +
        name +
        "» (variante " +
        v +
        ") continua ativo nos Keyframes. A grade A/B começa vazia — gere de novo para novas opções."
    );
    syncOptionsFromCtx(ctx);
    var out = Ph3aAvatarState.getOutputText();
    if ($("avatarOutputText") && out) $("avatarOutputText").value = out;
    return true;
  }

  async function onGenerate() {
    var apiKey = getKey();
    if (!apiKey) {
      alert("Configure a chave OpenAI.");
      return;
    }
    if (!refFiles.length) {
      alert("Anexe ou cole ao menos uma imagem.");
      return;
    }

    state.generating = true;
    $("btnGenerateAvatar").disabled = true;
    resetVariants();
    setApiDebug("");
    if ($("avatarOutputText")) {
      $("avatarOutputText").value = "Analisando referências…";
    }

    var refs = refFiles.map(function (f) {
      return f.dataUrl;
    });
    var options = getOptions();

    try {
      var kindHint =
        options.avatarKind === "human"
          ? " (tipo Realista — humano com feições da ref)"
          : " (tipo Abstrato — mascote)";
      setStatus("Passo 1/3 — analisando refs (visão)" + kindHint + "…");
      state.ctx = await Ph3aAvatarApi.analyzeAvatarProfile(apiKey, refs, options);
      logAnalyzeDebug(state.ctx);
      if (options.avatarKind === "human" && state.ctx.profile && state.ctx.profile.ref_subject_type === "human_photo") {
        setStatus("Ref detectada: pessoa real — gerando humano estilizado…");
      }
      updateOutput();

      setVariantSlot("A", "is-loading", null);
      setVariantSlot("B", "is-loading", null);

      setStatus("Passo 2/3 — gerando Variante A…");
      try {
        state.images.a = await Ph3aAvatarApi.generateOneVariant(apiKey, state.ctx, refs, "A");
        logVariantDebug(state.ctx, "A", true);
        setVariantSlot("A", "has-image", state.images.a);
      } catch (eA) {
        logVariantDebug(state.ctx, "A", false, eA.message || String(eA));
        throw eA;
      }

      setStatus("Passo 2/3 — gerando Variante B…");
      try {
        state.images.b = await Ph3aAvatarApi.generateOneVariant(apiKey, state.ctx, refs, "B");
        logVariantDebug(state.ctx, "B", true);
        setVariantSlot("B", "has-image", state.images.b);
      } catch (eB) {
        logVariantDebug(state.ctx, "B", false, eB.message || String(eB));
        throw eB;
      }

      setStatus("Passo 3/3 — pronto. Escolha A ou B, baixe o PNG e copie o profile em DEBUG / SAÍDA.");
      chooseVariant("A");
    } catch (e) {
      setStatus(e.message || String(e), true);
      if ($("avatarOutputText")) $("avatarOutputText").value = "Erro: " + (e.message || e);
      appendApiDebug("── ERRO ──\n" + (e.message || String(e)));
      setVariantSlot("A", "is-error", null);
      setVariantSlot("B", "is-error", null);
    } finally {
      state.generating = false;
      renderRefThumbs();
    }
  }

  function setupDropPaste() {
    var zone = $("avatarRefZone");
    if (!zone) return;

    zone.addEventListener("dragover", function (e) {
      e.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", function () {
      zone.classList.remove("drag-over");
    });
    zone.addEventListener("drop", function (e) {
      e.preventDefault();
      zone.classList.remove("drag-over");
      Array.from(e.dataTransfer.files).forEach(function (file) {
        addRefFromBlob(file, file.name);
      });
    });

    zone.addEventListener("paste", function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") === 0) {
          e.preventDefault();
          var blob = items[i].getAsFile();
          if (blob) addRefFromBlob(blob, "clipboard.png");
        }
      }
    });

    document.addEventListener("paste", function (e) {
      if (document.activeElement && document.activeElement.tagName === "TEXTAREA") return;
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") === 0) {
          e.preventDefault();
          var blob = items[i].getAsFile();
          if (blob) addRefFromBlob(blob, "clipboard.png");
        }
      }
    });

    $("avatarFileInput") &&
      $("avatarFileInput").addEventListener("change", function (e) {
        Array.from(e.target.files).forEach(function (file) {
          addRefFromBlob(file, file.name);
        });
        e.target.value = "";
      });
  }

  function initKeyUi() {
    var keyInput = $("openaiApiKey");
    if (keyInput) {
      keyInput.value = getKey();
      keyInput.addEventListener("input", renderRefThumbs);
    }
    $("btnSaveOpenAiKey") &&
      $("btnSaveOpenAiKey").addEventListener("click", function () {
        if (window.Ph3aOpenAI) Ph3aOpenAI.saveOpenAiKey(keyInput.value);
        setStatus("Chave salva neste navegador.");
        renderRefThumbs();
      });
    $("btnTestOpenAiKey") &&
      $("btnTestOpenAiKey").addEventListener("click", function () {
        Ph3aOpenAI.testOpenAiKey(getKey())
          .then(function (msg) {
            setStatus("OpenAI OK: " + msg);
          })
          .catch(function (e) {
            setStatus(e.message, true);
          });
      });
  }

  function syncRenderModeCards() {
    document.querySelectorAll(".avatar-render-option").forEach(function (label) {
      var input = label.querySelector('input[name="renderMode"]');
      label.classList.toggle("is-selected", Boolean(input && input.checked));
    });
  }

  var AVATAR_KIND_HINTS = {
    abstract:
      "Abstrato: cria um mascote PH3A (criatura, animal ou personagem estilizado) a partir da ref — pode reinterpretar a ideia, não precisa ser humano.",
    human:
      "Realista: se a ref for uma pessoa, gera um humano estilizado (2D ou 3D Pixar) com feições reconhecíveis — não vira gato nem criatura.",
  };

  function syncAvatarKindHint() {
    var el = $("avatarKindHint");
    if (!el) return;
    var checked = document.querySelector('input[name="avatarKind"]:checked');
    var kind = checked && checked.value === "human" ? "human" : "abstract";
    el.textContent = AVATAR_KIND_HINTS[kind] || AVATAR_KIND_HINTS.abstract;
  }

  function syncAvatarKindCards() {
    document.querySelectorAll(".avatar-kind-option").forEach(function (label) {
      var input = label.querySelector('input[name="avatarKind"]');
      label.classList.toggle("is-selected", Boolean(input && input.checked));
    });
    syncAvatarKindHint();
  }

  function init() {
    if (!$("avatarRefZone") || initialized) return;
    initialized = true;
    setupDropPaste();
    initKeyUi();
    toggleCustomPalette();
    document.querySelectorAll('input[name="paletteMode"]').forEach(function (el) {
      el.addEventListener("change", toggleCustomPalette);
    });
    document.querySelectorAll('input[name="renderMode"]').forEach(function (el) {
      el.addEventListener("change", syncRenderModeCards);
    });
    syncRenderModeCards();
    document.querySelectorAll('input[name="avatarKind"]').forEach(function (el) {
      el.addEventListener("change", syncAvatarKindCards);
    });
    syncAvatarKindCards();

    $("avatarDebugToggle") &&
      $("avatarDebugToggle").addEventListener("click", function () {
        toggleDebugPanel();
      });

    document.querySelectorAll(".avatar-debug-tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setDebugTab(btn.getAttribute("data-debug-tab"));
      });
    });
    setDebugTab("profile");

    $("btnPickRefs") &&
      $("btnPickRefs").addEventListener("click", function () {
        $("avatarFileInput").click();
      });
    $("btnGenerateAvatar") &&
      $("btnGenerateAvatar").addEventListener("click", function () {
        onGenerate();
      });
    $("btnCopyAvatarOutput") &&
      $("btnCopyAvatarOutput").addEventListener("click", function () {
        var ta = $("avatarOutputText");
        if (!ta || !ta.value) return;
        navigator.clipboard.writeText(ta.value).then(function () {
          setStatus("Profile copiado.");
        });
      });
    $("btnClearRefs") &&
      $("btnClearRefs").addEventListener("click", function () {
        refFiles = [];
        renderRefThumbs();
        setStatus("Referências limpas.");
      });

    document.querySelectorAll(".avatar-variant-pick").forEach(function (btn) {
      btn.addEventListener("click", function () {
        chooseVariant(btn.getAttribute("data-pick"));
      });
    });

    renderRefThumbs();
    clearCreationVariants();
    if (!hintSavedCustomAvatar()) {
      setStatus("Arraste, escolha arquivos ou Ctrl+V com imagem. Depois clique em «Gerar avatar».");
    }
  }

  window.Ph3aAvatarUi = {
    init: init,
    clearCreationVariants: clearCreationVariants,
    clearDebugOutput: clearDebugOutput,
  };
})();
