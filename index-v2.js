/**
 * index_v2.html — navbar, abas Avatar / Keyframes, modal de API.
 */
(function () {
  var $ = function (id) {
    return document.getElementById(id);
  };

  function updateNavbarAvatar() {
    if (!window.Ph3aAvatarState) return;
    var st = Ph3aAvatarState.getStatusShort();
    var badge = $("navbarAvatarBadge");
    var btnCustom = $("btnAvatarModeCustom");
    var btnCubo = document.querySelector('[data-avatar-mode="cubo"]');
    var thumb = $("navbarAvatarThumb");

    if (badge) {
      badge.textContent = st.label;
      badge.title = st.detail;
      badge.classList.toggle("is-custom", st.type === "custom");
      badge.classList.toggle("is-cubo", st.type === "cubo");
    }
    if (btnCustom) {
      btnCustom.disabled = !Ph3aAvatarState.hasCustomAvatar();
      btnCustom.classList.toggle("is-active", Ph3aAvatarState.getMode() === "custom");
    }
    if (btnCubo) {
      btnCubo.classList.toggle("is-active", Ph3aAvatarState.getMode() === "cubo");
    }
    if (thumb) {
      var url = Ph3aAvatarState.getChosenImageDataUrl();
      if (Ph3aAvatarState.getMode() === "custom" && url) {
        thumb.src = url;
        thumb.hidden = false;
      } else {
        thumb.hidden = true;
        thumb.removeAttribute("src");
      }
    }
  }

  function setActiveTab(tabId) {
    document.querySelectorAll(".v2-tab-btn").forEach(function (btn) {
      btn.classList.toggle("is-active", btn.getAttribute("data-tab") === tabId);
    });
    document.querySelectorAll(".v2-panel").forEach(function (panel) {
      var isActive = panel.getAttribute("data-panel") === tabId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
    try {
      sessionStorage.setItem("ph3a_v2_tab", tabId);
    } catch {
      /* ignore */
    }
    if (tabId === "keyframes") {
      if (window.Ph3aApp && Ph3aApp.refreshOutputs) Ph3aApp.refreshOutputs();
      else if (window.Ph3aKeyframesUi) Ph3aKeyframesUi.refresh();
    }
  }

  function openSettings() {
    var modal = $("settingsModal");
    if (modal) modal.hidden = false;
  }

  function closeSettings() {
    var modal = $("settingsModal");
    if (modal) modal.hidden = true;
  }

  function setAvatarMode(mode) {
    if (!window.Ph3aAvatarState) return;
    if (mode === "custom" && !Ph3aAvatarState.hasCustomAvatar()) {
      alert("Defina um avatar personalizado na aba Avatar primeiro (gere e escolha A ou B).");
      return;
    }
    Ph3aAvatarState.setMode(mode);
    updateNavbarAvatar();
    if (window.Ph3aApp && Ph3aApp.refreshOutputs) Ph3aApp.refreshOutputs();
  }

  function initTabs() {
    document.querySelectorAll(".v2-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveTab(btn.getAttribute("data-tab"));
      });
    });
    var saved = "avatar";
    try {
      saved = sessionStorage.getItem("ph3a_v2_tab") || "avatar";
    } catch {
      /* ignore */
    }
    setActiveTab(saved);
  }

  function initAvatarModeToggle() {
    document.querySelectorAll("[data-avatar-mode]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setAvatarMode(btn.getAttribute("data-avatar-mode"));
      });
    });
  }

  function initSettingsModal() {
    $("btnOpenSettings")?.addEventListener("click", openSettings);
    $("btnCloseSettings")?.addEventListener("click", closeSettings);
    $("settingsModal")?.addEventListener("click", function (e) {
      if (e.target.id === "settingsModal") closeSettings();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSettings();
    });
  }

  function init() {
    if (window.Ph3aAvatarUi) Ph3aAvatarUi.init();
    initTabs();
    initAvatarModeToggle();
    initSettingsModal();
    updateNavbarAvatar();
    window.addEventListener("ph3a-avatar-changed", updateNavbarAvatar);

    $("btnGoKeyframes")?.addEventListener("click", function () {
      setActiveTab("keyframes");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
