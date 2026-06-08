/**
 * Avatar PH3A — análise de refs (visão) + 2 variantes A/B (images/edits).
 */
(function (global) {
  var PH3A_PALETTE = {
    id: "ph3a",
    label: "Paleta PH3A",
    primary: "#1a1a1a",
    accent: "#E94E1B",
    text: "#F5F1EA",
    description:
      "Charcoal #1a1a1a (fundos/corpo escuro), laranja PH3A #E94E1B (acentos/glow), cream #F5F1EA (textos/nuvens/claros).",
  };

  function useLocalProxy() {
    return window.PH3A_USE_PROXY === true || Boolean(window.PH3A_OPENAI_PROXY_URL);
  }

  function apiBase() {
    var host = typeof location !== "undefined" ? location.hostname : "";
    if (useLocalProxy() && (host === "localhost" || host === "127.0.0.1")) return location.origin;
    return "";
  }

  function chatUrl() {
    if (window.PH3A_OPENAI_PROXY_URL) return window.PH3A_OPENAI_PROXY_URL;
    var base = apiBase();
    return base ? base + "/api/openai/chat" : "https://api.openai.com/v1/chat/completions";
  }

  function imagesEditsUrl() {
    var base = apiBase();
    return base ? base + "/api/openai/images/edits" : "https://api.openai.com/v1/images/edits";
  }

  function imagesGenerationsUrl() {
    var base = apiBase();
    return base ? base + "/api/openai/images/generations" : "https://api.openai.com/v1/images/generations";
  }

  function authHeaders(apiKey, contentType) {
    var h = { Authorization: "Bearer " + apiKey.trim() };
    if (contentType) h["Content-Type"] = contentType;
    return h;
  }

  function formatErr(status, data) {
    var msg = (data && data.error && data.error.message) || JSON.stringify(data);
    if (status === 401) return "Chave OpenAI inválida.";
    if (status === 429) return "Limite/cota OpenAI (429). Tente mais tarde.";
    return "Erro OpenAI " + status + ": " + String(msg).slice(0, 400);
  }

  function paletteFromOptions(opts) {
    if (!opts || opts.paletteMode !== "custom") return PH3A_PALETTE;
    return {
      id: "custom",
      label: "Paleta customizada",
      primary: opts.colorPrimary || "#1a1a1a",
      accent: opts.colorAccent || "#E94E1B",
      text: opts.colorText || "#F5F1EA",
      notes: opts.paletteNotes || "",
      description:
        "Primária " +
        (opts.colorPrimary || "#1a1a1a") +
        ", acento " +
        (opts.colorAccent || "#E94E1B") +
        ", claros " +
        (opts.colorText || "#F5F1EA") +
        (opts.paletteNotes ? ". Notas: " + opts.paletteNotes : "."),
    };
  }

  function normalizeAvatarKind(avatarKind) {
    return avatarKind === "human" ? "human" : "abstract";
  }

  function styleLabel(renderMode, avatarKind) {
    var human = normalizeAvatarKind(avatarKind) === "human";
    if (human && renderMode === "3d") {
      return "personagem HUMANO estilizado 3D (estilo Pixar/Disney, render suave, NÃO fotorealista)";
    }
    if (human) {
      return "personagem HUMANO estilizado 2D editorial tech-cute (NÃO animal, NÃO criatura)";
    }
    return renderMode === "3d"
      ? "ilustração 3D estilizada (render suave, NÃO fotorealista)"
      : "ilustração 2D flat editorial tech-cute (NÃO 3D metálico)";
  }

  function buildAnalyzePrompt(palette, renderMode, avatarKind) {
    var kind = normalizeAvatarKind(avatarKind);
    if (kind === "human") {
      return (
        "Analise as imagens de referência anexadas e defina UM avatar HUMANO estilizado para a série de vídeos PH3A.\n\n" +
        "Modo escolhido: Tipo Realista (Mascote Humano) — o personagem final deve ser claramente HUMANO (corpo e rosto humanos estilizados).\n" +
        "Estilo de render: " +
        styleLabel(renderMode, "human") +
        ".\n" +
        "Paleta obrigatória (roupas, acentos, fundos — remapear cores das refs): " +
        palette.description +
        "\n\n" +
        "REGRAS CRÍTICAS:\n" +
        "1) Se a ref for foto ou retrato de pessoa real: preserve traços reconhecíveis — formato do rosto, cabelo/barba, óculos, tom de pele simplificado, idade aparente, expressão base. NÃO transforme a pessoa em animal, criatura, objeto ou mascote abstrato.\n" +
        "2) Não é fotografia — é desenho/ilustração estilizada (3D tipo Pixar se render 3d; 2D editorial se render 2d).\n" +
        "3) NÃO copie cenários, logos, marcas, textos ou terceiros nas refs.\n" +
        "4) Se a ref não for pessoa (objeto/cenário): crie um apresentador humano genérico amigável na paleta PH3A.\n\n" +
        "Responda APENAS JSON válido (sem markdown):\n" +
        "{\n" +
        '  "ref_subject_type": "human_photo | illustration_human | mascot_or_creature | other",\n' +
        '  "name": "NOME-CURTO (ex: ERIKA-PH, DALVANI-PH)",\n' +
        '  "morphology": "corpo humano estilizado, proporções, postura, roupa na paleta",\n' +
        '  "style_render": "' +
        renderMode +
        '",\n' +
        '  "likeness_notes": "o que manter da pessoa nas refs (rosto, cabelo, barba, óculos, etc.)",\n' +
        '  "palette_applied": "como a paleta foi aplicada (roupa, acentos, fundo)",\n' +
        '  "facial_traits": "olhos, nariz, boca, expressão base amigável neutra (para o PNG de referência)",\n' +
        '  "distinctive_details": "acessórios, gravata, blazer, etc. na paleta",\n' +
        '  "do_not_copy": "lista do que ignorar das refs",\n' +
        '  "avatar_block": "1 parágrafo em português — personagem HUMANO estilizado completo (substitui CUBO-PH). Traços da ref na paleta PH3A; expressão base amigável — feições por cena vêm nos keyframes depois."\n' +
        "}"
      );
    }
    return (
      "Analise as imagens de referência anexadas e defina UM mascote/avatar para a série de vídeos PH3A.\n\n" +
      "Modo escolhido: Tipo Abstrato (Mascote) — pode ser criatura, animal estilizado ou personagem não-humano na identidade PH3A.\n" +
      "Estilo de render escolhido pelo usuário: " +
      styleLabel(renderMode, "abstract") +
      ".\n" +
      "Paleta obrigatória: " +
      palette.description +
      "\n\n" +
      "NÃO copie cenários, logos, marcas, textos ou outros personagens das refs — só extraia identidade do personagem principal.\n" +
      "Remapeie as cores originais das refs para a paleta indicada.\n\n" +
      "Responda APENAS JSON válido (sem markdown):\n" +
      "{\n" +
      '  "ref_subject_type": "human_photo | mascot_or_creature | object | other",\n' +
      '  "name": "NOME-CURTO do avatar (ex: DINO-PH)",\n' +
      '  "morphology": "silhueta, espécie/tipo, proporções",\n' +
      '  "style_render": "' +
      renderMode +
      '",\n' +
      '  "palette_applied": "como a paleta foi aplicada ao personagem",\n' +
      '  "facial_traits": "olhos, boca, expressão base amigável",\n' +
      '  "distinctive_details": "acessórios, membros, elementos únicos",\n' +
      '  "do_not_copy": "lista do que ignorar das refs",\n' +
      '  "avatar_block": "1 parágrafo em português, pronto para colar no briefing mestre dos keyframes — substitui CUBO-PH. Descreva o personagem completo na paleta escolhida."\n' +
      "}"
    );
  }

  function parseAnalyzeJson(raw) {
    var jsonStr = String(raw || "").trim();
    var fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();
    var start = jsonStr.indexOf("{");
    var end = jsonStr.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Análise não retornou JSON.");
    return JSON.parse(jsonStr.slice(start, end + 1));
  }

  function analyzeAvatarProfile(apiKey, refDataUrls, options) {
    var palette = paletteFromOptions(options);
    var renderMode = options.renderMode === "3d" ? "3d" : "2d";
    var avatarKind = normalizeAvatarKind(options && options.avatarKind);
    var urls = refDataUrls.slice(0, 6);
    if (!urls.length) return Promise.reject(new Error("Anexe ao menos uma imagem de referência."));

    var content = [{ type: "text", text: buildAnalyzePrompt(palette, renderMode, avatarKind) }];
    urls.forEach(function (url) {
      content.push({ type: "image_url", image_url: { url: url, detail: "low" } });
    });

    return fetch(chatUrl(), {
      method: "POST",
      headers: authHeaders(apiKey, "application/json"),
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1200,
        temperature: 0.4,
        messages: [{ role: "user", content: content }],
      }),
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error(formatErr(res.status, data));
        var text =
          data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        var parsed = parseAnalyzeJson(text);
        return {
          profile: parsed,
          palette: palette,
          renderMode: renderMode,
          avatarKind: avatarKind,
          _apiDebug: {
            step: "analyze",
            model: "gpt-4o-mini",
            prompt: buildAnalyzePrompt(palette, renderMode, avatarKind),
            rawContent: text || "",
          },
        };
      });
    });
  }

  function buildVariantImagePrompt(ctx, variant) {
    var p = ctx.profile;
    var name = p.name || "AVATAR-PH";
    var human = normalizeAvatarKind(ctx.avatarKind) === "human";
    var variantLine =
      variant === "A"
        ? "Variante A — UM personagem só: pose frontal, corpo inteiro visível, expressão amigável neutra, fundo neutro charcoal (#1a1a1a), centralizado."
        : "Variante B — UM personagem só: mesma identidade, pose leve 3/4 ou detalhe/acessório sutil, mesma paleta, fundo charcoal, expressão amigável neutra.";

    var subjectRules = human
      ? "OBRIGATÓRIO: personagem HUMANO estilizado (rosto e corpo humanos). Mantenha traços reconhecíveis da pessoa nas refs (likeness). PROIBIDO: gato, animal, criatura, robô mascote, objeto antropomorfizado.\n" +
        (p.ref_subject_type === "human_photo"
          ? "Refs = foto de pessoa real → desenho 3D Pixar ou 2D editorial dessa pessoa, NÃO fotorealista.\n"
          : "")
      : "Pode ser mascote/criatura estilizado PH3A (comportamento abstrato).\n";

    var likeness = human && p.likeness_notes ? "Likeness: " + p.likeness_notes + "\n" : "";

    return (
      "As imagens anexadas são referências " +
      (human ? "da pessoa / retrato" : "de estilo/forma") +
      ". Gere UMA imagem NOVA.\n\n" +
      subjectRules +
      variantLine +
      "\n\nCOMPOSIÇÃO (só escolha do personagem — NÃO é keyframe de vídeo):\n" +
      "- Exatamente UM personagem na imagem (corpo inteiro ou 3/4), uma expressão neutra/amigável.\n" +
      "- As feições por cena (pensativa, focada, feliz, etc.) serão pedidas depois nos KEYFRAMES — NÃO desenhar aqui.\n" +
      "- PROIBIDO: grade de rostos, painel de expressões, turnaround sheet, múltiplas cabeças, fila de emoções, close-ups laterais de variações faciais.\n\n" +
      "Personagem: " +
      name +
      "\n" +
      styleLabel(ctx.renderMode, ctx.avatarKind) +
      "\nPaleta: " +
      ctx.palette.description +
      "\n\n" +
      likeness +
      "Morfo: " +
      (p.morphology || "") +
      "\nDetalhes: " +
      (p.distinctive_details || "") +
      "\nNÃO copiar: " +
      (p.do_not_copy || "") +
      "\n\nSem texto on-screen. Sem logos. Sem watermark. PNG limpo — uma figura só, para avatar sheet."
    );
  }

  function dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(function (r) {
      return r.blob();
    });
  }

  function dataUrlToProxyPayload(dataUrl, index) {
    var m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return Promise.reject(new Error("Data URL inválida na ref " + (index + 1)));
    var ext = m[1].indexOf("jpeg") >= 0 || m[1].indexOf("jpg") >= 0 ? "jpeg" : "png";
    return Promise.resolve({
      filename: "ref" + (index + 1) + "." + ext,
      content_type: m[1],
      b64: m[2],
    });
  }

  function parseImageItem(apiKey, item) {
    if (!item) throw new Error("OpenAI não retornou imagem.");
    if (item.b64_json) return Promise.resolve("data:image/png;base64," + item.b64_json);
    if (item.url) {
      return fetch(item.url)
        .then(function (r) {
          return r.blob();
        })
        .then(function (blob) {
          return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        });
    }
    return Promise.reject(new Error("Resposta sem imagem."));
  }

  function postEditsDirect(apiKey, spec, prompt, blobs) {
    var form = new FormData();
    form.append("model", spec.model);
    form.append("prompt", prompt);
    form.append("n", "1");
    if (spec.size) form.append("size", spec.size);
    if (spec.quality) form.append("quality", spec.quality);
    blobs.forEach(function (blob, i) {
      var name = blob.type && blob.type.indexOf("jpeg") >= 0 ? "ref" + (i + 1) + ".jpeg" : "ref" + (i + 1) + ".png";
      form.append("image[]", blob, name);
    });
    return fetch(imagesEditsUrl(), {
      method: "POST",
      headers: authHeaders(apiKey),
      body: form,
    });
  }

  function postEditsViaProxy(apiKey, spec, prompt, dataUrls) {
    return Promise.all(dataUrls.map(dataUrlToProxyPayload)).then(function (images) {
      return fetch(imagesEditsUrl(), {
        method: "POST",
        headers: authHeaders(apiKey, "application/json"),
        body: JSON.stringify({
          model: spec.model,
          prompt: prompt,
          n: 1,
          size: spec.size,
          quality: spec.quality,
          images: images,
        }),
      });
    });
  }

  function postGenerations(apiKey, spec, prompt) {
    return fetch(imagesGenerationsUrl(), {
      method: "POST",
      headers: authHeaders(apiKey, "application/json"),
      body: JSON.stringify({
        model: spec.model,
        prompt: prompt,
        n: 1,
        size: spec.size,
        quality: spec.quality,
      }),
    });
  }

  var IMAGE_SPEC = { model: "gpt-image-2", size: "1024x1024", quality: "high" };

  function generateOneVariant(apiKey, ctx, refDataUrls, variant) {
    var prompt = buildVariantImagePrompt(ctx, variant);
    var urls = refDataUrls.slice(0, 4);
    var spec = IMAGE_SPEC;
    if (window.PH3A_IMAGE_MODEL) spec = { model: window.PH3A_IMAGE_MODEL, size: "1024x1024", quality: "high" };

    function attempt(useEdits) {
      if (useEdits && urls.length) {
        return Promise.all(urls.map(dataUrlToBlob)).then(function (blobs) {
          var viaProxy = Boolean(apiBase());
          var req = viaProxy
            ? postEditsViaProxy(apiKey, spec, prompt, urls)
            : postEditsDirect(apiKey, spec, prompt, blobs);
          return req.then(function (res) {
            return res.json().then(function (data) {
              if (!res.ok) throw new Error(formatErr(res.status, data));
              return parseImageItem(apiKey, data.data && data.data[0]);
            });
          });
        });
      }
      return postGenerations(apiKey, spec, prompt).then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(formatErr(res.status, data));
          return parseImageItem(apiKey, data.data && data.data[0]);
        });
      });
    }

    return attempt(true).catch(function () {
      return attempt(false);
    });
  }

  function generateAvatarVariants(apiKey, refDataUrls, ctx) {
    return generateOneVariant(apiKey, ctx, refDataUrls, "A").then(function (urlA) {
      return generateOneVariant(apiKey, ctx, refDataUrls, "B").then(function (urlB) {
        return { a: urlA, b: urlB };
      });
    });
  }

  function buildUsageOutput(ctx, chosenVariant) {
    var p = ctx.profile;
    var name = p.name || "AVATAR-PH";
    var variantLabel = chosenVariant === "B" ? "Variante B" : chosenVariant === "A" ? "Variante A" : "(ainda não escolhida)";
    var render = ctx.renderMode === "3d" ? "3D estilizado" : "2D flat PH3A";
    var tipo =
      normalizeAvatarKind(ctx.avatarKind) === "human"
        ? "Realista (mascote humano)"
        : "Abstrato (mascote)";

    return (
      "================================================================================\n" +
      "AVATAR PH3A — perfil para keyframes\n" +
      "Gerado em: " +
      new Date().toISOString().slice(0, 16).replace("T", " ") +
      "\nTipo: " +
      tipo +
      "\nEstilo: " +
      render +
      " · Paleta: " +
      ctx.palette.label +
      "\nEscolha atual: " +
      variantLabel +
      "\n================================================================================\n\n" +
      "── SUBSTITUI CUBO_PH NO BRIEFING MESTRE (PARTE 1) ──\n\n" +
      (p.avatar_block || "(bloco não gerado)") +
      "\n\n── DETALHES (referência interna) ──\n\n" +
      "Nome: " +
      name +
      "\nMorfologia: " +
      (p.morphology || "") +
      "\nTraços: " +
      (p.facial_traits || "") +
      "\nDetalhes: " +
      (p.distinctive_details || "") +
      "\nPaleta aplicada: " +
      (p.palette_applied || ctx.palette.description) +
      "\nNão copiar das refs: " +
      (p.do_not_copy || "") +
      "\n\n" +
      "────────────────────────────────────────\n" +
      "COMO USAR NOS PROMPTS DE KEYFRAME (futuro)\n" +
      "────────────────────────────────────────\n\n" +
      "1. ChatGPT manual\n" +
      "   • Cole o bloco «SUBSTITUI CUBO_PH» no lugar do parágrafo CUBO-PH em prompts-chatgpt-keyframes.txt.\n" +
      "   • Anexe o PNG baixado (avatar_" +
      (chosenVariant === "B" ? "variante_b" : chosenVariant === "A" ? "variante_a" : "escolhido") +
      ".png) em TODOS os keyframes.\n" +
      "   • Nos blocos KEYFRAME, troque «CUBO-PH idêntico ao mascote anexado» por:\n" +
      '     «' +
      name +
      " idêntico ao avatar sheet anexado».\n\n" +
      "2. Ferramenta §5 (index.html)\n" +
      "   • Arraste o PNG escolhido na zona do mascote (pode usar só 1 imagem oficial).\n" +
      "   • Quando o index ler o profile salvo (futuro), usará este texto no briefing.\n\n" +
      "3. KF2–KF4\n" +
      "   • Anexe também o keyframe anterior gerado, como no fluxo CUBO-PH.\n\n" +
      "── EXEMPLO — linha KEYFRAME 1 ──\n\n" +
      "KEYFRAME 1 — {PRODUTO} · {narrativa}\n\n" +
      "16:9 " +
      (ctx.renderMode === "3d"
        ? normalizeAvatarKind(ctx.avatarKind) === "human"
          ? "personagem humano 3D estilizado PH3A"
          : "ilustração 3D estilizada PH3A"
        : normalizeAvatarKind(ctx.avatarKind) === "human"
          ? "personagem humano 2D estilizado PH3A"
          : "ilustração 2D flat PH3A") +
      ". " +
      name +
      " idêntico ao avatar sheet anexado: à esquerda, expressão pensativa.\n" +
      "KF4: nome do produto cream #F5F1EA em cor única (sem letras alternadas); PH3A maiúsculas laranja #E94E1B só.\n" +
      "{metáfora visual do produto — sceneVisualHints}\n\n" +
      "Fundo charcoal + blobs laranja nos cantos.\n" +
      'Título: "{c1t}" · Subtítulo: "{c1s}"\n\n' +
      "================================================================================"
    );
  }

  global.Ph3aAvatarApi = {
    PH3A_PALETTE: PH3A_PALETTE,
    paletteFromOptions: paletteFromOptions,
    buildAnalyzePrompt: buildAnalyzePrompt,
    buildVariantImagePrompt: buildVariantImagePrompt,
    analyzeAvatarProfile: analyzeAvatarProfile,
    generateOneVariant: generateOneVariant,
    generateAvatarVariants: generateAvatarVariants,
    buildUsageOutput: buildUsageOutput,
  };
})(typeof window !== "undefined" ? window : globalThis);
