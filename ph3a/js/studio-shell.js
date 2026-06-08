/**
 * ph3a/index.html — navbar, abas Avatar / Keyframes / Vídeos, modal de API.
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
    var kfBanner = $("kfAvatarBanner");
    var videosBanner = $("videosAvatarBanner");

    if (badge) {
      badge.textContent = st.label;
      badge.title = st.detail;
      badge.classList.toggle("is-custom", st.type === "custom");
      badge.classList.toggle("is-cubo", st.type === "cubo");
      badge.classList.toggle("stitch-badge-custom", st.type === "custom");
      badge.classList.toggle("stitch-badge-cubo", st.type === "cubo");
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
    var bannerText =
      st.type === "custom"
        ? st.label + (st.detail ? " — " + st.detail : "")
        : "Avatar Cubo PH3A — CUBO-PH";
    if (kfBanner) {
      kfBanner.textContent = bannerText;
      kfBanner.classList.toggle("is-custom", st.type === "custom");
      kfBanner.classList.toggle("is-cubo", st.type === "cubo");
    }
    if (videosBanner) {
      videosBanner.textContent = st.type === "custom" ? st.label : "Avatar Cubo PH3A";
    }
  }

  function syncVideoModeCards() {
    var cards = document.querySelectorAll(".ph3a-mode-card");
    if (!cards.length) return;
    var checked = document.querySelector('input[name="vertente"]:checked');
    var mode = checked ? checked.value : "omni";
    cards.forEach(function (card) {
      card.classList.toggle("is-selected", card.getAttribute("data-mode") === mode);
    });
  }

  function updateStitchTabStyles(tabId) {
    document.querySelectorAll(".stitch-tab-btn").forEach(function (btn) {
      var active = btn.getAttribute("data-tab") === tabId;
      btn.classList.toggle("is-active", active);
      btn.classList.toggle("stitch-tab-active", active);
      btn.classList.toggle("stitch-tab-inactive", !active);
    });
  }

  function setActiveTab(tabId) {
    updateStitchTabStyles(tabId);
    document.querySelectorAll(".v2-panel, .stitch-panel").forEach(function (panel) {
      var isActive = panel.getAttribute("data-panel") === tabId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
    try {
      sessionStorage.setItem("ph3a_studio_tab", tabId);
    } catch {
      /* ignore */
    }
    if (tabId === "keyframes" || tabId === "videos") {
      if (window.Ph3aApp && Ph3aApp.refreshOutputs) Ph3aApp.refreshOutputs();
      else if (window.Ph3aKeyframesUi) Ph3aKeyframesUi.refresh();
    }
    if (tabId === "videos") syncVideoModeCards();
  }

  function openSettings() {
    var modal = $("settingsModal");
    if (modal) modal.hidden = false;
  }

  function closeSettings() {
    var modal = $("settingsModal");
    if (modal) modal.hidden = true;
  }

  function openAvatarImagePreview(opts) {
    var url = opts && opts.url;
    var titleText = opts && opts.title;
    var subtitleText = opts && opts.subtitle;
    if (!url && window.Ph3aAvatarState) {
      url = Ph3aAvatarState.getChosenImageDataUrl();
      if (Ph3aAvatarState.getMode() === "custom" && url) {
        var st = Ph3aAvatarState.getStatusShort();
        titleText = st.label;
        subtitleText = st.detail || "Avatar em uso nos keyframes";
      }
    }
    if (!url) return;
    var modal = $("avatarPreviewModal");
    var img = $("avatarPreviewImage");
    var titleEl = $("avatarPreviewModalTitle");
    var subtitleEl = $("avatarPreviewSubtitle");
    if (img) {
      img.src = url;
      img.alt =
        (titleText || "Avatar") + (subtitleText ? " — " + subtitleText : "");
    }
    if (titleEl) titleEl.textContent = titleText || "Avatar";
    if (subtitleEl) subtitleEl.textContent = subtitleText || "";
    if (modal) modal.hidden = false;
  }

  function closeAvatarPreview() {
    var modal = $("avatarPreviewModal");
    if (modal) modal.hidden = true;
  }

  function initAvatarPreviewModal() {
    $("btnCloseAvatarPreview")?.addEventListener("click", closeAvatarPreview);
    $("avatarPreviewModal")?.addEventListener("click", function (e) {
      if (e.target.id === "avatarPreviewModal") closeAvatarPreview();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var modal = $("avatarPreviewModal");
      if (modal && !modal.hidden) closeAvatarPreview();
    });
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
      saved =
        sessionStorage.getItem("ph3a_studio_tab") ||
        sessionStorage.getItem("ph3a_v2_tab") ||
        "avatar";
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

  function initNavigationShortcuts() {
    $("btnGoKeyframes")?.addEventListener("click", function () {
      setActiveTab("keyframes");
    });
    $("btnGoVideos")?.addEventListener("click", function () {
      setActiveTab("videos");
    });
    $("btnGoKeyframesFromVideos")?.addEventListener("click", function () {
      setActiveTab("keyframes");
    });

    document.querySelectorAll('input[name="vertente"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        syncVideoModeCards();
        if (window.Ph3aApp && Ph3aApp.refreshOutputs) Ph3aApp.refreshOutputs();
      });
    });
  }

  function init() {
    if (window.Ph3aAvatarUi) Ph3aAvatarUi.init();
    initTabs();
    initAvatarModeToggle();
    initSettingsModal();
    initAvatarPreviewModal();
    initNavigationShortcuts();
    updateNavbarAvatar();
    syncVideoModeCards();
    window.addEventListener("ph3a-avatar-changed", function () {
      updateNavbarAvatar();
    });

  }

  window.Ph3aStudioShell = window.Ph3aStudioShell || {};
  window.Ph3aStudioShell.openAvatarImagePreview = openAvatarImagePreview;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
