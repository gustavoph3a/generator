/**
 * Prompts de keyframe — modo Dynamic (white label).
 */
(function (global) {
  function isDynamicMode() {
    return global.Ph3aStudioMode && Ph3aStudioMode.getMode() === "dynamic";
  }

  function getCtx() {
    return global.Ph3aDynamicState ? Ph3aDynamicState.get() : null;
  }

  function getPaletteDesc() {
    var p = global.Ph3aDynamicState && Ph3aDynamicState.getSelectedPalette();
    if (!p) return "cores da marca do cliente";
    return (
      "primária " +
      p.primary +
      ", acento " +
      p.accent +
      ", claros " +
      p.text +
      (p.notes ? " (" + p.notes + ")" : "")
    );
  }

  function getHints(num) {
    var ctx = getCtx();
    var h = (ctx && ctx.visualHints) || {};
    if (num === 1) return h.k1 || "Metáfora visual do problema.";
    if (num === 2) return h.k2 || "Fluxo com 4 etapas.";
    if (num === 3) return h.k3 || "Benefício visual.";
    return h.k4 || "Assinatura da marca.";
  }

  function dynamicRules() {
    return (
      "Regras:\n" +
      "• Paleta: " +
      getPaletteDesc() +
      ".\n" +
      "• IDIOMA: português do Brasil (pt-BR). Sem inglês.\n" +
      "• ORTOGRAFIA: textos on-screen EXATAMENTE entre aspas.\n" +
      "• SEM dados pessoais reais. SEM fotorealismo de pessoas reais.\n" +
      "• NÃO usar marca PH3A, CUBO-PH ou produtos PH3A."
    );
  }

  function dynamicKeyframeMouthHint() {
    if (typeof avatarKeyframeMouthHint === "function") {
      return "\n\n" + avatarKeyframeMouthHint();
    }
    return "";
  }

  function dynamicKeyframeMouthLine() {
    if (typeof avatarKeyframeMouthLine === "function") {
      return "\n" + avatarKeyframeMouthLine();
    }
    return "";
  }

  function getAvatarNameSafe() {
    return typeof getAvatarName === "function" ? getAvatarName() : "AVATAR";
  }

  function getAvatarStyleSafe() {
    return typeof getAvatarStyleHint === "function" ? getAvatarStyleHint() : "ilustração estilizada";
  }

  function isCustomAvatarSafe() {
    return typeof isCustomAvatarActive === "function" && isCustomAvatarActive();
  }

  /** Com avatar personalizado: usa feições do preview (kfExpressions). Senão: emoção pela copy da cena. */
  function dynamicAvatarLead(num, n) {
    if (isCustomAvatarSafe() && typeof avatarKfLead === "function") {
      return avatarKfLead(num, n);
    }

    var name = getAvatarNameSafe();
    var style = getAvatarStyleSafe();
    var scenes = n.scenes;
    var attach = name + " idêntico ao avatar sheet anexado. Um único mascote em toda a série.";

    if (num === 1) {
      return (
        "16:9 " +
        style +
        ". " +
        attach +
        " Posição: à esquerda.\n" +
        'Expressão facial coerente com o PROBLEMA desta cena — título "' +
        scenes.c1t +
        '" e subtítulo "' +
        scenes.c1s +
        '". Escolha emoção que combine (ex.: confuso, frustrado, curioso, neutro, preocupado) — NÃO usar tristeza/desapontamento genérico se o texto não pedir.'
      );
    }
    if (num === 2) {
      return (
        "16:9 " +
        style +
        ". Mesmo " +
        name +
        " idêntico ao keyframe 1. " +
        attach +
        '\nExpressão engajada ou focada, coerente com a ação "' +
        scenes.c2t +
        '". Pode apontar para o fluxo horizontal com 4 nós.'
      );
    }
    if (num === 3) {
      return (
        "16:9 " +
        style +
        ". Mesmo " +
        name +
        " idêntico ao keyframe 1. " +
        attach +
        '\nExpressão positiva (alívio, satisfação, entusiasmo leve) coerente com os benefícios "' +
        scenes.c3a +
        '" / "' +
        scenes.c3b +
        '".'
      );
    }
    return (
      "16:9 " +
      style +
      ". Mesmo " +
      name +
      " idêntico aos keyframes anteriores. " +
      attach +
      " Posição: centralizado.\nExpressão confiante e acolhedora — momento de assinatura da marca (sem tristeza)."
    );
  }

  function dynamicExecLine(num) {
    if (isCustomAvatarSafe() && typeof buildAvatarExecLine === "function") {
      return buildAvatarExecLine(num);
    }
    var name = getAvatarNameSafe();
    if (num === 1) {
      return (
        "Gere UMA imagem estática 16:9 (1920×1080). " +
        getAvatarStyleSafe() +
        ". " +
        name +
        " idêntico ao avatar sheet. Expressão deve combinar com os textos on-screen desta cena — não copiar pose/emotion de templates PH3A. " +
        (typeof avatarKeyframeMouthLine === "function" ? avatarKeyframeMouthLine() : "")
      );
    }
    return (
      "Gere UMA imagem 16:9. Mesmo " +
      name +
      ", mesma identidade e coerência emocional com o arco desta narrativa."
    );
  }

  function buildDynamicBriefingBlock(n) {
    var ctx = getCtx();
    var brand = (ctx && ctx.productName) || n.productDisplay;
    var tagline = n.tagline || (ctx && ctx.tagline) || "";
    var scenes = n.scenes;
    return (
      "Projeto: vídeo explicativo · " +
      brand +
      " (white label).\n" +
      "Entrega: KEYFRAMES estáticos 16:9 (1920×1080).\n" +
      "Narrativa: " +
      n.label +
      "\n\n" +
      (typeof getAvatarIdentityBlock === "function" ? getAvatarIdentityBlock() : "") +
      "\n\nArco (4 cenas):\n" +
      '• Cena 1 — Problema: "' +
      scenes.c1t +
      '" — ' +
      scenes.c1s +
      "\n" +
      '• Cena 2 — Ação: "' +
      scenes.c2t +
      '" — ' +
      scenes.c2f.join(" → ") +
      "\n" +
      '• Cena 3 — Benefício: "' +
      scenes.c3a +
      '" / "' +
      scenes.c3b +
      '"\n" +
      '• Cena 4 — Marca: ' +
      brand +
      ' + "' +
      tagline +
      '"\n\n' +
      dynamicRules() +
      dynamicKeyframeMouthHint() +
      (isCustomAvatarSafe()
        ? "\n\nAvatar personalizado: cada KEYFRAME pode pedir feição diferente (preview) — manter identidade do sheet.\n"
        : "") +
      "\n\nAguarde KEYFRAME 1, 2, 3 e 4. Gere UMA imagem por vez."
    );
  }

  function buildDynamicKeyframeBlock(n, num) {
    var scenes = n.scenes;
    var brand = n.productDisplay;
    var palette = getPaletteDesc();
    var hints = getHints(num);

    if (num === 1) {
      return (
        "KEYFRAME 1 — " +
        brand +
        " · " +
        n.label +
        "\n\n" +
        dynamicAvatarLead(1, n) +
        (isCustomAvatarSafe() || typeof getKfExpressionDirective !== "function"
          ? ""
          : "\n" + getKfExpressionDirective(n, 1)) +
        "\n" +
        hints +
        "\n\nFundo escuro (" +
        palette +
        ") + acentos da paleta.\n" +
        "Textos on-screen (ortografia EXATA, pt-BR):\n" +
        'Título grande bold: "' +
        scenes.c1t +
        '"\n' +
        'Subtítulo menor: "' +
        scenes.c1s +
        '"' +
        dynamicKeyframeMouthLine() +
        "\n\n1920×1080."
      );
    }
    if (num === 2) {
      return (
        "KEYFRAME 2 — " +
        brand +
        "\n\n" +
        dynamicAvatarLead(2, n) +
        (isCustomAvatarSafe() || typeof getKfExpressionDirective !== "function"
          ? ""
          : "\n" + getKfExpressionDirective(n, 2)) +
        "\n" +
        scenes.c2f.map(function (s, i) {
          return i + 1 + '. "' + s + '"';
        }).join("\n") +
        "\n" +
        hints +
        "\n\nTexto topo bold: \"" +
        scenes.c2t +
        "\"" +
        dynamicKeyframeMouthLine() +
        "\n1920×1080."
      );
    }
    if (num === 3) {
      return (
        "KEYFRAME 3 — " +
        brand +
        "\n\n" +
        dynamicAvatarLead(3, n) +
        (isCustomAvatarSafe() || typeof getKfExpressionDirective !== "function"
          ? ""
          : "\n" + getKfExpressionDirective(n, 3)) +
        "\n" +
        hints +
        '\n\nTextos topo esquerdo:\n"' +
        scenes.c3a +
        '"\n"' +
        scenes.c3b +
        '"' +
        dynamicKeyframeMouthLine() +
        "\n\n1920×1080."
      );
    }
    return (
      "KEYFRAME 4 — " +
      brand +
      " · Assinatura\n\n" +
      dynamicAvatarLead(4, n) +
      (isCustomAvatarSafe() || typeof getKfExpressionDirective !== "function"
        ? ""
        : "\n" + getKfExpressionDirective(n, 4)) +
      "\n" +
      hints +
      "\n\nTexto centralizado inferior (EXATOS):\n\"" +
      brand +
      '"\n"' +
      (n.tagline || "") +
      "\"" +
      dynamicKeyframeMouthLine() +
      "\n\n1920×1080."
    );
  }

  function buildDynamicKeyframePromptForApi(n, num) {
    return (
      "── BRIEFING (white label) ──\n\n" +
      buildDynamicBriefingBlock(n) +
      "\n\n── KEYFRAME A GERAR ──\n\n" +
      buildDynamicKeyframeBlock(n, num) +
      "\n\n── EXECUÇÃO ──\n\n" +
      dynamicExecLine(num) +
      " Paleta do cliente. Sem PH3A."
    );
  }

  global.Ph3aDynamicPrompts = {
    isDynamicMode: isDynamicMode,
    buildDynamicBriefingBlock: buildDynamicBriefingBlock,
    buildDynamicKeyframeBlock: buildDynamicKeyframeBlock,
    buildDynamicKeyframePromptForApi: buildDynamicKeyframePromptForApi,
  };
})(typeof window !== "undefined" ? window : globalThis);
