/**
 * §5 — Keyframes por API (OpenAI). Geração manual 1 a 1 ou pares 1–2 / 3–4.
 */
(function () {
  const $ = (id) => document.getElementById(id);

  const mascotFiles = [];
  const generated = { 1: null, 2: null, 3: null, 4: null };
  let generating = false;
  let initialized = false;
  let mascotAutoSynced = false;

  function setKfStatus(msg, isError) {
    const el = $("kfApiStatus");
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-error", Boolean(isError && msg));
  }

  function getKey() {
    if (window.Ph3aApp && Ph3aApp.getOpenAiKey) return Ph3aApp.getOpenAiKey();
    return ($("openaiApiKey") && $("openaiApiKey").value.trim()) || "";
  }

  function avatarHintSuffix() {
    if (!window.Ph3aAvatarState) return "";
    const s = Ph3aAvatarState.getStatusShort();
    return " · Avatar ativo: " + s.label + (s.detail ? " (" + s.detail + ")" : "");
  }

  function mascotRefFileName() {
    if (!window.Ph3aAvatarState) return "avatar-sheet.png";
    const ctx = Ph3aAvatarState.getProfileCtx();
    if (ctx && ctx.presetLabel) return ctx.presetLabel + ".png";
    if (ctx && ctx.profile && ctx.profile.name) return ctx.profile.name + ".png";
    return "avatar-sheet.png";
  }

  function syncMascotFromAvatarState() {
    if (!window.Ph3aAvatarState) return;
    if (Ph3aAvatarState.getMode() === "custom" && Ph3aAvatarState.hasCustomAvatar()) {
      const url = Ph3aAvatarState.getChosenImageDataUrl();
      mascotFiles.length = 0;
      if (url) {
        mascotFiles.push({ name: mascotRefFileName(), dataUrl: url });
      }
      mascotAutoSynced = true;
      renderMascotThumbs();
      return;
    }
    if (mascotAutoSynced) {
      mascotFiles.length = 0;
      mascotAutoSynced = false;
      renderMascotThumbs();
    }
  }

  function refresh() {
    syncMascotFromAvatarState();
    const n = window.Ph3aApp && Ph3aApp.getSelectedNarrative();
    const hint = $("kfApiNarrativeHint");
    const section = $("keyframesApiSection");
    const avatarBanner = $("kfAvatarBanner");
    if (avatarBanner && window.Ph3aAvatarState) {
      const st = Ph3aAvatarState.getStatusShort();
      avatarBanner.textContent = st.label + " — " + st.detail;
      avatarBanner.classList.toggle("is-custom", st.type === "custom");
      avatarBanner.classList.toggle("is-cubo", st.type === "cubo");
    }
    if (hint) {
      if (n) {
        hint.textContent =
          "Narrativa: «" +
          n.label +
          "» — " +
          n.productDisplay +
          ". Com referência visual usamos images/edits." +
          avatarHintSuffix();
        hint.classList.remove("is-error");
      } else {
        hint.textContent = "Selecione uma narrativa no §2 antes de gerar imagens." + avatarHintSuffix();
        hint.classList.add("is-error");
      }
    }
    if (section) section.classList.toggle("kf-ready", Boolean(n));
    updateButtons();
  }

  function updateButtons() {
    const hasNarrative = Boolean(window.Ph3aApp && Ph3aApp.getSelectedNarrative());
    const hasKey = Boolean(getKey());
    const disabled = generating || !hasNarrative || !hasKey;
    document.querySelectorAll("[data-kf-gen]").forEach((btn) => {
      btn.disabled = disabled;
    });
  }

  function renderMascotThumbs() {
    const box = $("mascotThumbs");
    if (!box) return;
    box.innerHTML = "";
    mascotFiles.forEach((item, i) => {
      const wrap = document.createElement("div");
      wrap.className = "mascot-thumb";
      const img = document.createElement("img");
      img.src = item.dataUrl;
      img.alt = item.name;
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "mascot-thumb-remove";
      rm.textContent = "×";
      rm.title = "Remover";
      rm.addEventListener("click", () => {
        mascotFiles.splice(i, 1);
        mascotAutoSynced = false;
        renderMascotThumbs();
      });
      wrap.appendChild(img);
      wrap.appendChild(rm);
      box.appendChild(wrap);
    });
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  async function onMascotFiles(fileList) {
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) continue;
      if (mascotFiles.length >= 4) break;
      const dataUrl = await readFileAsDataUrl(file);
      mascotFiles.push({ name: file.name, dataUrl: dataUrl });
    }
    mascotAutoSynced = false;
    renderMascotThumbs();
    if (mascotFiles.length) {
      setKfStatus(mascotFiles.length + " referência(s) do mascote (opcional).");
    }
  }

  function setupDropZone() {
    const zone = $("mascotDropZone");
    if (!zone) return;
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      if (e.dataTransfer.files.length) onMascotFiles(e.dataTransfer.files);
    });
    $("mascotFileInput")?.addEventListener("change", (e) => {
      if (e.target.files.length) onMascotFiles(e.target.files);
      e.target.value = "";
    });
  }

  /** Um estado visual por card: is-idle | is-loading | is-error | has-image */
  function setSlotState(num, state) {
    const slot = document.querySelector('.kf-slot[data-kf="' + num + '"]');
    if (!slot) return;

    const imgEl = slot.querySelector(".kf-slot-img");
    const dl = slot.querySelector(".kf-slot-download");
    const url = generated[num];

    slot.classList.remove("is-idle", "is-loading", "is-error", "has-image");

    if (state === "loading") {
      slot.classList.add("is-loading");
      if (imgEl) imgEl.removeAttribute("src");
      if (dl) dl.hidden = true;
      return;
    }

    if (state === "error") {
      slot.classList.add("is-error");
      if (imgEl) imgEl.removeAttribute("src");
      if (dl) dl.hidden = true;
      return;
    }

    if (state === "done" && url) {
      slot.classList.add("has-image");
      if (imgEl) {
        imgEl.alt = "Keyframe " + num;
        imgEl.onerror = () => setSlotState(num, "error");
        imgEl.src = url;
      }
      if (dl) {
        dl.hidden = false;
        dl.onclick = () => downloadDataUrl(url, "keyframe_" + num + ".png");
      }
      return;
    }

    slot.classList.add("is-idle");
    if (imgEl) imgEl.removeAttribute("src");
    if (dl) dl.hidden = true;
  }

  function resetAllSlotsIdle() {
    [1, 2, 3, 4].forEach((n) => {
      if (generated[n]) setSlotState(n, "done");
      else setSlotState(n, "idle");
    });
  }

  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  function getApiPrompt(num) {
    const getPrompt =
      (window.Ph3aApp && Ph3aApp.getKeyframePromptForApi) || Ph3aApp.getKeyframePrompt;
    return getPrompt(num);
  }

  async function generateOne(num) {
    const apiKey = getKey();
    if (!apiKey) {
      alert("Configure a chave OpenAI no painel acima.");
      return;
    }
    const n = window.Ph3aApp && Ph3aApp.getSelectedNarrative();
    if (!n) {
      alert("Selecione uma narrativa no §2.");
      return;
    }

    generating = true;
    updateButtons();
    setSlotState(num, "loading");

    const textPrompt = getApiPrompt(num);
    if (!textPrompt) {
      setSlotState(num, "idle");
      generating = false;
      updateButtons();
      return;
    }

    const referenceDataUrls = mascotFiles.map((f) => f.dataUrl);
    const prevKeyframeDataUrl = num >= 2 && generated[num - 1] ? generated[num - 1] : null;

    if (!referenceDataUrls.length) {
      setKfStatus(
        "KEYFRAME " +
          num +
          " — sem fotos: só texto (generations). Adicione referências na zona acima, se quiser.",
        false
      );
    } else {
      setKfStatus(
        "KEYFRAME " +
          num +
          " — images/edits com " +
          referenceDataUrls.length +
          " ref(s)" +
          (prevKeyframeDataUrl ? " + KF anterior" : "") +
          "… ~60–120s"
      );
    }

    try {
      const dataUrl = await Ph3aKeyframeImages.generateKeyframeImage(apiKey, textPrompt, {
        referenceDataUrls: referenceDataUrls,
        prevKeyframeDataUrl: prevKeyframeDataUrl,
      });
      generated[num] = dataUrl;
      setSlotState(num, "done");
      setKfStatus("KEYFRAME " + num + " pronto. Baixe ou gere o próximo.");
    } catch (e) {
      setSlotState(num, "error");
      setKfStatus(e.message || String(e), true);
    } finally {
      generating = false;
      updateButtons();
    }
  }

  async function generateRange(from, to) {
    for (let n = from; n <= to; n++) {
      await generateOne(n);
      const slot = document.querySelector('.kf-slot[data-kf="' + n + '"]');
      if (slot && slot.classList.contains("is-error")) break;
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;

    setupDropZone();
    resetAllSlotsIdle();

    document.querySelectorAll("[data-kf-gen]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kf = btn.getAttribute("data-kf-gen");
        if (kf === "all") generateRange(1, 4);
        else generateOne(parseInt(kf, 10));
      });
    });

    $("btnKfDownloadAll")?.addEventListener("click", () => {
      [1, 2, 3, 4].forEach((n) => {
        if (generated[n]) downloadDataUrl(generated[n], "keyframe_" + n + ".png");
      });
    });

    $("btnMascotPick")?.addEventListener("click", () => $("mascotFileInput")?.click());

    $("btnKfClear")?.addEventListener("click", () => {
      [1, 2, 3, 4].forEach((n) => {
        generated[n] = null;
        setSlotState(n, "idle");
      });
      setKfStatus("Pré-visualizações limpas.");
    });

    window.addEventListener("ph3a-avatar-changed", () => refresh());

    refresh();
  }

  window.Ph3aKeyframesUi = { refresh: refresh, init: init };

  init();
})();
