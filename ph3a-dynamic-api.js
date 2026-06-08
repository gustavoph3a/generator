/**
 * API modo Dynamic — analisa base do cliente + narrativas white label.
 */
(function (global) {
  function parseJsonFromText(raw) {
    var jsonStr = String(raw || "").trim();
    var fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();
    try {
      return JSON.parse(jsonStr);
    } catch {
      var start = jsonStr.indexOf("{");
      var end = jsonStr.lastIndexOf("}");
      if (start >= 0 && end > start) return JSON.parse(jsonStr.slice(start, end + 1));
      throw new Error("Resposta da IA não é JSON válido.");
    }
  }

  function normalizePalette(p, index) {
    var id = p.id || (index === 0 ? "a" : "b");
    return {
      id: id,
      label: String(p.label || "Paleta " + (index + 1)).slice(0, 60),
      primary: p.primary || "#1a1a1a",
      accent: p.accent || "#3366FF",
      text: p.text || "#F5F1EA",
      notes: String(p.notes || "").slice(0, 120),
    };
  }

  function analyzeClientBase(apiKey, baseText) {
    if (!global.Ph3aOpenAI || !Ph3aOpenAI.chatCompletion) {
      return Promise.reject(new Error("OpenAI não disponível."));
    }
    var excerpt = String(baseText).slice(0, 8000);
    var system =
      "Você analisa bases de produto de clientes para vídeos explicativos B2B/B2C.\n" +
      "Responda APENAS JSON válido (sem markdown).\n" +
      "Se reconhecer marca conhecida (Uber, Nubank, etc.), use cores oficiais aproximadas em hex.\n" +
      "Se marca desconhecida, proponha 2 paletas distintas coerentes com o tom do produto.\n\n" +
      "Schema:\n" +
      "{\n" +
      '  "productName": "NOME CURTO DO PRODUTO/MARCA (caps)",\n' +
      '  "tagline": "frase curta pt-BR para cena 4 (assinatura)",\n' +
      '  "brandKnown": true|false,\n' +
      '  "brandName": "nome da marca se conhecida ou vazio",\n' +
      '  "industry": "setor em poucas palavras",\n' +
      '  "tone": "tom visual (ex.: tech moderno, corporativo, consumer)",\n' +
      '  "palettes": [\n' +
      '    {"id":"a","label":"…","primary":"#…","accent":"#…","text":"#…","notes":"…"},\n' +
      '    {"id":"b","label":"…","primary":"#…","accent":"#…","text":"#…","notes":"…"}\n' +
      "  ],\n" +
      '  "visualHints": {\n' +
      '    "k1": "metáfora visual cena 1 (problema) — ícones/cenário específicos do produto",\n' +
      '    "k2": "metáfora cena 2 (fluxo/ação) — 4 etapas visuais",\n' +
      '    "k3": "metáfora cena 3 (benefício)",\n' +
      '    "k4": "metáfora cena 4 (assinatura)"\n' +
      "  }\n" +
      "}";

    var user = "Analise esta base de produto e extraia marca, paletas e metáforas visuais:\n\n" + excerpt;

    return Ph3aOpenAI.chatCompletion(apiKey, { system: system, user: user }).then(function (r) {
      var data = parseJsonFromText(r.text);
      var palettes = Array.isArray(data.palettes) ? data.palettes.map(normalizePalette) : [];
      if (!palettes.length) {
        palettes.push(
          normalizePalette({ id: "a", label: "Neutro escuro", primary: "#1a1a1a", accent: "#3366FF", text: "#F5F1EA" }, 0)
        );
      }
      if (palettes.length === 1) {
        palettes.push(
          normalizePalette(
            {
              id: "b",
              label: "Alternativa clara",
              primary: "#2a2a2a",
              accent: palettes[0].accent,
              text: "#FFFFFF",
              notes: "variação de contraste",
            },
            1
          )
        );
      }
      return {
        productName: String(data.productName || "PRODUTO").slice(0, 40),
        tagline: String(data.tagline || "").slice(0, 120),
        brandKnown: Boolean(data.brandKnown),
        brandName: String(data.brandName || "").slice(0, 60),
        industry: String(data.industry || "").slice(0, 80),
        tone: String(data.tone || "").slice(0, 80),
        palettes: palettes.slice(0, 2),
        visualHints: data.visualHints || {
          k1: "Metáfora visual do problema do produto.",
          k2: "Fluxo horizontal com 4 etapas.",
          k3: "Benefício com destaque visual.",
          k4: "Assinatura da marca centralizada.",
        },
      };
    });
  }

  function fetchDynamicNarratives(apiKey, opts) {
    if (!global.Ph3aOpenAI || !Ph3aOpenAI.chatCompletion) {
      return Promise.reject(new Error("OpenAI não disponível."));
    }
    var palette = opts.palette || {};
    var excerpt = String(opts.baseText || "").slice(0, 6000);
    var system =
      "Você cria narrativas para vídeo explicativo de produto (white label).\n" +
      "pt-BR, textos curtos on-screen, sem inglês.\n" +
      "NÃO mencione PH3A, CUBO-PH nem produtos de outras empresas.\n" +
      "Produto/marca: " +
      (opts.productDisplay || "PRODUTO") +
      "\nPaleta: primária " +
      (palette.primary || "#1a1a1a") +
      ", acento " +
      (palette.accent || "#3366FF") +
      ", claros " +
      (palette.text || "#F5F1EA") +
      (palette.notes ? " (" + palette.notes + ")" : "") +
      "\n\nResponda APENAS JSON: {\"narratives\":[ ...5 objetos... ]} cada um com label (título curto só, sem \"Ângulo\" nem numeração), scenes{c1t,c1s,c2t,c2f[4 strings],c3a,c3b}, narration.";

    var variation = opts.variationId != null ? opts.variationId : Date.now();
    var user =
      "Produto: " +
      opts.productDisplay +
      "\nTagline cena 4: " +
      opts.tagline +
      "\nSetor: " +
      (opts.industry || "") +
      "\nTom: " +
      (opts.tone || "") +
      "\nLote #" +
      variation +
      " — 5 narrativas com abordagens DIFERENTES.\n\nBase:\n" +
      excerpt;

    return Ph3aOpenAI.chatCompletion(apiKey, { system: system, user: user }).then(function (r) {
      if (!global.Ph3aOpenAI.parseNarrativesJson) {
        return Promise.reject(new Error("parseNarrativesJson indisponível."));
      }
      return Ph3aOpenAI.parseNarrativesJson(r.text, {
        productDisplay: opts.productDisplay,
        tagline: opts.tagline,
        profile: "dynamic",
      });
    });
  }

  global.Ph3aDynamicApi = {
    analyzeClientBase: analyzeClientBase,
    fetchDynamicNarratives: fetchDynamicNarratives,
  };
})(typeof window !== "undefined" ? window : globalThis);
