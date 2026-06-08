/**

 * Presets locais — mascotes em ph3a/avatar/ e PH3A Team em avatar-base/.

 */

(function () {

  var $ = function (id) {

    return document.getElementById(id);

  };



  var MASCOT_AVATAR_DIR = "avatar/";

  var MASCOT_PRESETS_DIR = MASCOT_AVATAR_DIR + "presets/";

  var TEAM_AVATAR_DIR = "../avatar-base/";

  var TEAM_PRESETS_DIR = TEAM_AVATAR_DIR + "presets/";

  var DEFAULT_TEAM_PRESET_ID = "dalvani";



  var activePresetId = null;

  var activeTeamId = null;

  var teamPresetIds = {};



  function blobToDataUrl(blob) {

    return new Promise(function (resolve, reject) {

      var r = new FileReader();

      r.onload = function () {

        resolve(r.result);

      };

      r.onerror = reject;

      r.readAsDataURL(blob);

    });

  }



  function fetchImageDataUrl(relativePath, baseDir) {

    var dir = baseDir || MASCOT_AVATAR_DIR;

    return fetch(dir + relativePath)

      .then(function (res) {

        if (!res.ok) throw new Error("Imagem não encontrada: " + dir + relativePath);

        return res.blob();

      })

      .then(blobToDataUrl);

  }



  function loadPresetDefinition(id, presetsDir) {

    return fetch(presetsDir + id + ".json").then(function (res) {

      if (!res.ok) throw new Error("Preset sem profile: " + id);

      return res.json();

    });

  }



  function resolvePresetImage(def) {

    var variant = def.chosenVariant === "B" ? "B" : "A";

    if (variant === "B" && def.imageB) return def.imageB;

    return def.image || def.id + ".png";

  }



  function buildCtxFromPreset(def, presetSource) {

    return {

      profile: def.profile,

      palette: def.palette,

      renderMode: def.renderMode === "3d" ? "3d" : "2d",

      avatarKind: def.avatarKind === "human" ? "human" : "abstract",

      presetId: def.id,

      presetLabel: def.label,

      presetSource: presetSource || "mascot",

      chosenVariant: def.chosenVariant === "B" ? "B" : "A",

    };

  }



  function setPickerV2Tab(tab) {

    var isTeam = tab === "team";

    document.querySelectorAll(".avatar-picker-v2-tab").forEach(function (btn) {

      var on = btn.getAttribute("data-picker-tab") === tab;

      btn.classList.toggle("is-active", on);

      btn.setAttribute("aria-selected", on ? "true" : "false");

      btn.classList.toggle("text-on-surface-variant", !on);

    });

    var teamPanel = $("avatarPickerV2PanelTeam");

    var mascotPanel = $("avatarPickerV2PanelMascot");

    if (teamPanel) {

      teamPanel.classList.toggle("hidden", !isTeam);

      teamPanel.hidden = !isTeam;

    }

    if (mascotPanel) {

      mascotPanel.classList.toggle("hidden", isTeam);

      mascotPanel.hidden = isTeam;

    }

  }



  function markPresetSelected(id) {

    activePresetId = id;

    document.querySelectorAll(".avatar-preset-card[data-preset-id]").forEach(function (card) {

      card.classList.toggle("is-selected", card.getAttribute("data-preset-id") === id);

    });

  }



  function clearPresetSelection() {

    activePresetId = null;

    document.querySelectorAll(".avatar-preset-card[data-preset-id]").forEach(function (card) {

      card.classList.remove("is-selected");

    });

  }



  function markTeamSelected(id) {

    activeTeamId = id;

    document.querySelectorAll(".avatar-preset-card[data-team-id]").forEach(function (card) {

      card.classList.toggle("is-selected", card.getAttribute("data-team-id") === id);

    });

  }



  function clearTeamSelection() {

    activeTeamId = null;

    document.querySelectorAll(".avatar-preset-card[data-team-id]").forEach(function (card) {

      card.classList.remove("is-selected");

    });

  }



  function updatePresetStatus(msg, isError) {

    var el = $("avatarPickerV2Status");

    if (!el) return;

    el.textContent = msg || "";

    el.classList.toggle("is-error", Boolean(isError && msg));

  }



  function applyPresetUiAfterLoad(ctx, dataUrl, outputText, statusPrefix) {

    var variant = ctx.chosenVariant || "A";

    if (window.Ph3aAvatarState) {

      Ph3aAvatarState.saveCustomAvatar(ctx, variant, dataUrl, outputText);

    }



    var ta = $("avatarOutputText");

    if (ta) ta.value = outputText || "";



    if (ctx.presetSource === "team") setPickerV2Tab("team");

    else if (ctx.presetSource === "mascot") setPickerV2Tab("mascot");



    setApiDebugFromPreset(ctx);



    if (window.Ph3aAvatarUi && Ph3aAvatarUi.clearCreationVariants) {

      Ph3aAvatarUi.clearCreationVariants();

    }



    var label = ctx.presetLabel || ctx.presetId;

    updatePresetStatus(

      (statusPrefix || "Preset") + " «" + label + "» ativo — profile + PNG prontos para Keyframes (sem API)."

    );

  }



  function setApiDebugFromPreset(ctx) {

    var ta = $("avatarApiDebugText");

    if (!ta) return;

    ta.value =

      "── PRESET LOCAL (sem API) ──\n\n" +

      "ID: " +

      ctx.presetId +

      "\nLabel: " +

      ctx.presetLabel +

      "\nFonte: " +

      (ctx.presetSource === "team" ? "PH3A Team · avatar-base/" : "Mascote · ph3a/avatar/") +

      "\nTipo: " +

      (ctx.avatarKind === "human" ? "Realista (humano)" : "Abstrato") +

      "\nRender: " +

      ctx.renderMode +

      "\n\nProfile JSON:\n" +

      JSON.stringify(ctx.profile, null, 2);

  }



  function applyPresetFromSource(id, avatarDir, presetsDir, presetSource, statusPrefix) {

    updatePresetStatus("Carregando «" + id + "»…");



    if (presetSource === "team") {

      clearPresetSelection();

      markTeamSelected(id);

      setPickerV2Tab("team");

    } else {

      clearTeamSelection();

      markPresetSelected(id);

      setPickerV2Tab("mascot");

    }



    return loadPresetDefinition(id, presetsDir)

      .then(function (def) {

        var imageFile = resolvePresetImage(def);

        return Promise.all([Promise.resolve(def), fetchImageDataUrl(imageFile, avatarDir)]);

      })

      .then(function (pair) {

        var def = pair[0];

        var dataUrl = pair[1];

        var ctx = buildCtxFromPreset(def, presetSource);

        var variant = ctx.chosenVariant || "A";

        var outputText =

          window.Ph3aAvatarApi && Ph3aAvatarApi.buildUsageOutput

            ? Ph3aAvatarApi.buildUsageOutput(ctx, variant)

            : def.profile.avatar_block || "";

        outputText = outputText.replace(

          /Escolha atual: Variante [AB]/g,

          "Escolha atual: " + (statusPrefix || "Preset") + " · Variante " + variant

        );

        outputText = outputText.replace(

          /Escolha atual: \(ainda não escolhida\)/,

          "Escolha atual: " + (statusPrefix || "Preset") + " · Variante " + variant

        );

        applyPresetUiAfterLoad(ctx, dataUrl, outputText, statusPrefix);

        if (presetSource === "team") markTeamSelected(id);

        else markPresetSelected(id);

      })

      .catch(function (e) {

        if (presetSource === "team") clearTeamSelection();

        else clearPresetSelection();

        updatePresetStatus(e.message || String(e), true);

      });

  }



  function applyPreset(id) {

    return applyPresetFromSource(id, MASCOT_AVATAR_DIR, MASCOT_PRESETS_DIR, "mascot", "Mascote");

  }



  function applyTeamPreset(id) {

    return applyPresetFromSource(id, TEAM_AVATAR_DIR, TEAM_PRESETS_DIR, "team", "PH3A Team");

  }



  function renderPresetSkeletons(count, gridId) {

    var grid = $(gridId);

    if (!grid) return;

    var n = typeof count === "number" ? count : 3;

    grid.innerHTML = "";

    grid.classList.add("is-loading");

    grid.setAttribute("aria-busy", "true");

    for (var i = 0; i < n; i++) {

      var sk = document.createElement("div");

      sk.className = "avatar-preset-card avatar-preset-skeleton";

      sk.setAttribute("aria-hidden", "true");

      sk.innerHTML =

        '<div class="avatar-preset-skeleton-thumb"></div>' +

        '<div class="avatar-preset-skeleton-line"></div>' +

        '<div class="avatar-preset-skeleton-line is-short"></div>';

      grid.appendChild(sk);

    }

  }



  function renderPresetGrid(items, gridId, baseDir, dataAttr, onPick) {

    var grid = $(gridId);

    if (!grid) return;



    grid.classList.remove("is-loading");

    grid.setAttribute("aria-busy", "false");

    grid.innerHTML = "";



    var attr = dataAttr || "data-preset-id";

    var dir = baseDir || MASCOT_AVATAR_DIR;



    items.forEach(function (item) {

      var imageUrl = dir + (item.image || item.id + ".png");

      var card = document.createElement("div");

      card.className = "avatar-preset-card avatar-team-card";

      card.setAttribute(attr, item.id);

      card.setAttribute("role", "button");

      card.tabIndex = 0;



      var img = document.createElement("img");

      img.className = "avatar-preset-thumb";

      img.alt = item.label;

      img.src = imageUrl;

      img.onerror = function () {

        img.hidden = true;

      };



      var titleRow = document.createElement("div");

      titleRow.className = "avatar-preset-label-row";



      var title = document.createElement("span");

      title.className = "avatar-preset-label";

      title.textContent = item.label;



      var eyeBtn = document.createElement("button");

      eyeBtn.type = "button";

      eyeBtn.className = "avatar-preset-preview-btn";

      eyeBtn.setAttribute("aria-label", "Ver " + item.label);

      eyeBtn.title = "Ver avatar";

      eyeBtn.innerHTML =

        '<span class="material-symbols-outlined" aria-hidden="true">visibility</span>';

      eyeBtn.addEventListener("click", function (e) {

        e.stopPropagation();

        if (window.Ph3aStudioShell && Ph3aStudioShell.openAvatarImagePreview) {

          Ph3aStudioShell.openAvatarImagePreview({

            url: imageUrl,

            title: item.label,

            subtitle: item.subtitle || "preset local",

          });

        }

      });



      titleRow.appendChild(title);

      titleRow.appendChild(eyeBtn);



      var sub = document.createElement("span");

      sub.className = "avatar-preset-sub";

      sub.textContent = item.subtitle || "preset local";



      card.appendChild(img);

      card.appendChild(titleRow);

      card.appendChild(sub);

      card.addEventListener("click", function () {

        onPick(item.id);

      });

      card.addEventListener("keydown", function (e) {

        if (e.key === "Enter" || e.key === " ") {

          e.preventDefault();

          onPick(item.id);

        }

      });

      grid.appendChild(card);

    });

  }



  function appendCustomAvatarCard(grid, gridId) {

    if (!grid) return;

    var customBtn = document.createElement("button");

    customBtn.type = "button";

    customBtn.className = "avatar-preset-card avatar-preset-custom";

    if (gridId === "avatarPickerV2MascotGrid") customBtn.id = "btnAvatarPresetCustom";

    customBtn.innerHTML =

      '<span class="material-symbols-outlined avatar-preset-plus">add</span>' +

      '<span class="avatar-preset-label">Criar avatar</span>' +

      '<span class="avatar-preset-sub">API · refs + A/B</span>';

    customBtn.addEventListener("click", function () {

      clearPresetSelection();

      clearTeamSelection();

      var isTeamGrid = gridId === "avatarPickerV2TeamGrid";

      if (!isTeamGrid) setPickerV2Tab("mascot");

      updatePresetStatus("");

      var block = $("avatarCustomBlock");

      if (block) block.scrollIntoView({ behavior: "smooth", block: "start" });

    });

    grid.appendChild(customBtn);

  }



  function renderMascotGrid(items) {

    var grid = $("avatarPickerV2MascotGrid");

    if (!grid) return;

    renderPresetGrid(items, "avatarPickerV2MascotGrid", MASCOT_AVATAR_DIR, "data-preset-id", applyPreset);

    appendCustomAvatarCard(grid, "avatarPickerV2MascotGrid");

  }



  function renderTeamGrid(items) {

    teamPresetIds = {};

    (items || []).forEach(function (item) {

      teamPresetIds[item.id] = true;

    });

    var grid = $("avatarPickerV2TeamGrid");

    if (!grid) return;

    renderPresetGrid(items, "avatarPickerV2TeamGrid", TEAM_AVATAR_DIR, "data-team-id", applyTeamPreset);

    appendCustomAvatarCard(grid, "avatarPickerV2TeamGrid");

  }



  function loadManifest(url) {

    return fetch(url)

      .then(function (res) {

        if (!res.ok) return [];

        return res.json();

      })

      .catch(function () {

        return [];

      });

  }



  function applyDefaultTeamPresetIfNeeded() {

    if (!window.Ph3aAvatarState || !teamPresetIds[DEFAULT_TEAM_PRESET_ID]) return;

    if (Ph3aAvatarState.hasCustomAvatar()) return;

    applyTeamPreset(DEFAULT_TEAM_PRESET_ID);

  }



  function resetActiveAvatar() {

    clearPresetSelection();

    clearTeamSelection();

    setPickerV2Tab("team");

    if (window.Ph3aAvatarUi) {

      Ph3aAvatarUi.clearCreationVariants();

      Ph3aAvatarUi.clearDebugOutput();

    }

    if (teamPresetIds[DEFAULT_TEAM_PRESET_ID]) {

      applyTeamPreset(DEFAULT_TEAM_PRESET_ID);

      return;

    }

    if (window.Ph3aAvatarState) Ph3aAvatarState.clearCustomAvatar();

    updatePresetStatus("Avatar resetado — Cubo PH3A padrão nos Keyframes.");

  }



  function restoreSavedPresetUi() {

    if (!window.Ph3aAvatarState) return;

    var ctx = Ph3aAvatarState.getProfileCtx();

    var url = Ph3aAvatarState.getChosenImageDataUrl();

    if (!ctx || !ctx.presetId || !url) return;



    var prefix = "Preset";

    if (ctx.presetSource === "team" || teamPresetIds[ctx.presetId]) {

      markTeamSelected(ctx.presetId);

      setPickerV2Tab("team");

      prefix = "PH3A Team";

    } else {

      markPresetSelected(ctx.presetId);

      setPickerV2Tab("mascot");

    }

    updatePresetStatus(

      prefix + " «" + (ctx.presetLabel || ctx.presetId) + "» ativo — profile + PNG prontos para Keyframes (sem API)."

    );

  }



  function init() {

    if (!$("avatarPickerV2TeamGrid")) return;



    setPickerV2Tab("team");



    $("btnResetAvatarV2") &&

      $("btnResetAvatarV2").addEventListener("click", function () {

        resetActiveAvatar();

      });



    document.querySelectorAll(".avatar-picker-v2-tab").forEach(function (btn) {

      btn.addEventListener("click", function () {

        setPickerV2Tab(btn.getAttribute("data-picker-tab") || "team");

      });

    });



    var v2Team = $("avatarPickerV2TeamGrid");

    if (v2Team && !v2Team.children.length) {

      renderPresetSkeletons(9, "avatarPickerV2TeamGrid");

    }



    var v2Mascot = $("avatarPickerV2MascotGrid");

    if (v2Mascot && !v2Mascot.children.length) {

      renderPresetSkeletons(4, "avatarPickerV2MascotGrid");

    }



    Promise.all([

      loadManifest(MASCOT_PRESETS_DIR + "manifest.json"),

      loadManifest(TEAM_AVATAR_DIR + "manifest.json"),

    ]).then(function (pair) {

      renderMascotGrid(Array.isArray(pair[0]) ? pair[0] : []);

      renderTeamGrid(Array.isArray(pair[1]) ? pair[1] : []);

      restoreSavedPresetUi();

      applyDefaultTeamPresetIfNeeded();

    });

  }



  window.Ph3aAvatarPresets = {

    init: init,

    applyPreset: applyPreset,

    applyTeamPreset: applyTeamPreset,

    resetActiveAvatar: resetActiveAvatar,

    getActivePresetId: function () {

      return activePresetId;

    },

    getActiveTeamId: function () {

      return activeTeamId;

    },

    clearSelection: clearPresetSelection,

    clearTeamSelection: clearTeamSelection,

  };



  if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", init);

  } else {

    init();

  }

})();

