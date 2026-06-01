/**
 * Cliente Gemini (Google AI) — chave só no localStorage do navegador.
 */
(function (global) {
  const GEMINI_STORAGE_KEY = "ph3a_gemini_api_key";
  /* Ordem: modelos com cota free costuma variar por conta — tenta vários antes de desistir */
  const GEMINI_MODELS = [
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ];

  function loadGeminiKey() {
    try {
      return localStorage.getItem(GEMINI_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveGeminiKey(key) {
    try {
      if (key) localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
      else localStorage.removeItem(GEMINI_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function formatQuotaError(data) {
    const msg = data?.error?.message || "";
    if (/limit:\s*0/i.test(msg)) {
      return (
        "Cota gratuita desta chave/projeto está zerada (limit: 0) — comum em chaves AQ. ou projeto Cloud sem API ativa. " +
        "Solução: no AI Studio crie uma chave nova (preferir formato AIza…), ou use «Templates locais» (sem API). " +
        "Painel: https://ai.dev/rate-limit"
      );
    }
    if (status429Retry(msg)) {
      return "Limite de uso do Gemini (429). Aguarde ~1 min ou use «Templates locais».";
    }
    return "Cota / limite Gemini: " + msg.slice(0, 400);
  }

  function status429Retry(msg) {
    return /429|quota|rate limit|exceeded/i.test(msg);
  }

  function formatApiError(status, data) {
    const msg = data?.error?.message || JSON.stringify(data);
    if (status === 429) return formatQuotaError(data);
    if (status === 400 && /API key|API_KEY/i.test(msg)) {
      return (
        msg +
        " — Tente chave AIza… no AI Studio ou use Templates locais."
      );
    }
    return "Erro " + status + ": " + msg.slice(0, 500);
  }

  function corsHint(e) {
    if (String(e).includes("Failed to fetch")) {
      return (
        "Navegador bloqueou a chamada. Abra em http://localhost:8080 — na pasta ferramenta-textos: python -m http.server 8080"
      );
    }
    return String(e);
  }

  function generateContent(apiKey, prompt) {
    var lastError = null;
    var models = GEMINI_MODELS.slice();
    var idx = 0;

    function tryModel() {
      if (idx >= models.length) {
        return Promise.reject(new Error(lastError || "Nenhum modelo Gemini disponível."));
      }
      var model = models[idx++];
      var url =
        "https://generativelanguage.googleapis.com/v1beta/models/" +
        model +
        ":generateContent";

      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey.trim(),
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt.system + "\n\n---\n\n" + prompt.user }],
            },
          ],
          generationConfig: {
            temperature: 0.85,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            if (!res.ok) {
              lastError = formatApiError(res.status, data);
              if (res.status === 404 || res.status === 429 || res.status === 503) {
                return tryModel();
              }
              throw new Error(lastError);
            }
            var text = data && data.candidates && data.candidates[0];
            text =
              text &&
              text.content &&
              text.content.parts &&
              text.content.parts[0] &&
              text.content.parts[0].text;
            if (!text) throw new Error("Resposta vazia do Gemini.");
            return { text: text, model: model };
          });
        })
        .catch(function (e) {
          if (e.message && e.message.indexOf("Failed to fetch") === -1 && e.message.indexOf("Erro ") === 0) {
            throw e;
          }
          lastError = e.message || corsHint(e);
          if (String(e).indexOf("404") >= 0) return tryModel();
          throw new Error(lastError);
        });
    }

    return tryModel();
  }

  function parseNarrativesJson(raw, opts) {
    var jsonStr = raw.trim();
    var fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();
    var start = jsonStr.indexOf("[");
    var end = jsonStr.lastIndexOf("]");
    if (start === -1 || end === -1) throw new Error("Gemini não retornou JSON em array.");
    var arr = JSON.parse(jsonStr.slice(start, end + 1));
    if (!Array.isArray(arr) || arr.length < 1) throw new Error("Array de narrativas vazio.");

    return arr.slice(0, 5).map(function (item, i) {
      var s = item.scenes || {};
      var c2f = Array.isArray(s.c2f) ? s.c2f : ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"];
      return {
        id: "gemini-" + i,
        label: String(item.label || "Opção " + (i + 1)).slice(0, 80),
        scenes: {
          c1t: String(s.c1t || "O PROBLEMA É REAL").slice(0, 60),
          c1s: String(s.c1s || "").slice(0, 80),
          c2t: String(s.c2t || "A SOLUÇÃO PH3A").slice(0, 60),
          c2f: c2f.map(function (x) {
            return String(x).slice(0, 24);
          }).slice(0, 4),
          c3a: String(s.c3a || "RESULTADO CLARO").slice(0, 60),
          c3b: String(s.c3b || "").slice(0, 60),
        },
        narration: String(item.narration || "").slice(0, 280),
        productDisplay: opts.productDisplay,
        tagline: opts.tagline,
        profile: opts.profile,
      };
    });
  }

  function fetchNarrativesFromGemini(apiKey, opts) {
    var excerpt = opts.baseText.slice(0, 6000);
    var profileHints = {
      datatag:
        "Marketing digital: leads, visitantes anônimos, CAC, CPL, funil Visitante→Identidade→Score→Prioridade.",
      datafraud:
        "Antifraude: Evento→Validação→Dados→Decisão. Abertura: fraude na internet (marketing), evitar jargão 'regras genéricas'.",
      databusca: "Busca/enriquecimento PF/PJ, cadastro incompleto, localizar.",
      generic: "Produto B2B PH3A.",
    };

    var system =
      "Você cria narrativas para vídeo PH3A (CUBO-PH). pt-BR, marketing B2B, textos curtos on-screen, sem inglês, sem by PH3A.\n" +
      (profileHints[opts.profile] || profileHints.generic) +
      "\nResponda APENAS JSON: array de 5 objetos com label, scenes{c1t,c1s,c2t,c2f[4],c3a,c3b}, narration.";

    var variation = opts.variationId != null ? opts.variationId : Date.now();
    var user =
      "Produto: " +
      opts.productDisplay +
      "\nTagline cena 4: " +
      opts.tagline +
      "\nPerfil: " +
      opts.profile +
      "\nLote criativo #" +
      variation +
      " — proponha 5 ângulos DIFERENTES de narrativas anteriores típicas.\n\nBase:\n" +
      excerpt;

    return generateContent(apiKey, { system: system, user: user }).then(function (r) {
      return parseNarrativesJson(r.text, opts);
    });
  }

  function testGeminiKey(apiKey) {
    return generateContent(apiKey, {
      system: "OK",
      user: "1",
    }).then(function (r) {
      return "Modelo " + r.model + ": " + r.text.trim().slice(0, 40);
    });
  }

  function isQuotaErrorMessage(msg) {
    return /limit:\s*0|429|quota|cota gratuita/i.test(msg || "");
  }

  global.Ph3aGemini = {
    loadGeminiKey: loadGeminiKey,
    saveGeminiKey: saveGeminiKey,
    testGeminiKey: testGeminiKey,
    fetchNarrativesFromGemini: fetchNarrativesFromGemini,
    isQuotaErrorMessage: isQuotaErrorMessage,
  };
})(typeof window !== "undefined" ? window : globalThis);
