/**
 * Estado global do avatar (Cubo PH3A vs personalizado) — localStorage + eventos.
 */
(function (global) {
  var MODE_KEY = "ph3a_avatar_mode";
  var PROFILE_KEY = "ph3a_avatar_profile_json";
  var CHOSEN_KEY = "ph3a_avatar_chosen";
  var IMAGE_KEY = "ph3a_avatar_chosen_image";
  var OUTPUT_KEY = "ph3a_avatar_output_text";

  function dispatchChange() {
    try {
      global.dispatchEvent(new CustomEvent("ph3a-avatar-changed"));
    } catch {
      /* ignore */
    }
  }

  function getMode() {
    try {
      return global.localStorage.getItem(MODE_KEY) || "cubo";
    } catch {
      return "cubo";
    }
  }

  function setMode(mode) {
    if (mode !== "custom" && mode !== "cubo") return;
    try {
      global.localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
    dispatchChange();
  }

  function getProfileCtx() {
    try {
      var raw = global.localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getChosenImageDataUrl() {
    try {
      return global.localStorage.getItem(IMAGE_KEY) || null;
    } catch {
      return null;
    }
  }

  function hasCustomAvatar() {
    return Boolean(getProfileCtx() && getProfileCtx().profile && getChosenImageDataUrl());
  }

  function saveCustomAvatar(ctx, variant, imageDataUrl, outputText) {
    try {
      global.localStorage.setItem(PROFILE_KEY, JSON.stringify(ctx));
      global.localStorage.setItem(CHOSEN_KEY, variant || "A");
      global.localStorage.setItem(IMAGE_KEY, imageDataUrl || "");
      if (outputText) global.localStorage.setItem(OUTPUT_KEY, outputText);
      global.localStorage.setItem(MODE_KEY, "custom");
    } catch (e) {
      console.warn("ph3a avatar save", e);
    }
    dispatchChange();
  }

  function getIdentityBlock() {
    var ctx = getProfileCtx();
    if (!ctx || !ctx.profile) return null;
    return ctx.profile.avatar_block || null;
  }

  function getCharacterName() {
    var ctx = getProfileCtx();
    if (ctx && ctx.profile && ctx.profile.name) return ctx.profile.name;
    return "AVATAR-PH";
  }

  function getStyleHint() {
    var ctx = getProfileCtx();
    var human = ctx && ctx.avatarKind === "human";
    if (human && ctx.renderMode === "3d") return "personagem humano 3D estilizado PH3A (Pixar, não fotorealista)";
    if (human) return "personagem humano 2D estilizado PH3A";
    if (ctx && ctx.renderMode === "3d") return "ilustração 3D estilizada PH3A";
    return "ilustração 2D flat PH3A";
  }

  function getChosenVariant() {
    try {
      return global.localStorage.getItem(CHOSEN_KEY) || "";
    } catch {
      return "";
    }
  }

  function getStatusShort() {
    var ctx = getProfileCtx();
    if (ctx && ctx.presetId && getChosenImageDataUrl()) {
      var presetPrefix = ctx.presetSource === "team" ? "PH3A Team" : "Preset";
      return {
        type: "custom",
        label: presetPrefix + ": " + (ctx.presetLabel || ctx.presetId),
        detail: (ctx.profile && ctx.profile.name) || "avatar local",
      };
    }
    if (getMode() === "cubo" || !hasCustomAvatar()) {
      return { type: "cubo", label: "Avatar Cubo PH3A", detail: "Padrão PH3A · CUBO-PH" };
    }
    var name = getCharacterName();
    var v = getChosenVariant();
    return {
      type: "custom",
      label: "Avatar personalizado definido",
      detail: name + (v ? " · Variante " + v : ""),
    };
  }

  function getOutputText() {
    try {
      return global.localStorage.getItem(OUTPUT_KEY) || "";
    } catch {
      return "";
    }
  }

  function clearCustomAvatar() {
    try {
      global.localStorage.removeItem(PROFILE_KEY);
      global.localStorage.removeItem(CHOSEN_KEY);
      global.localStorage.removeItem(IMAGE_KEY);
      global.localStorage.removeItem(OUTPUT_KEY);
      global.localStorage.setItem(MODE_KEY, "cubo");
    } catch {
      /* ignore */
    }
    dispatchChange();
  }

  global.Ph3aAvatarState = {
    getMode: getMode,
    setMode: setMode,
    getProfileCtx: getProfileCtx,
    getChosenImageDataUrl: getChosenImageDataUrl,
    hasCustomAvatar: hasCustomAvatar,
    saveCustomAvatar: saveCustomAvatar,
    getIdentityBlock: getIdentityBlock,
    getCharacterName: getCharacterName,
    getStyleHint: getStyleHint,
    getChosenVariant: getChosenVariant,
    getStatusShort: getStatusShort,
    getOutputText: getOutputText,
    clearCustomAvatar: clearCustomAvatar,
  };
})(typeof window !== "undefined" ? window : globalThis);
