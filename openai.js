/**
 * Cliente OpenAI (ChatGPT API) — chave em localStorage ou config.local.js.
 */
(function (global) {
  const OPENAI_STORAGE_KEY = "ph3a_openai_api_key";
  const OPENAI_MODELS = ["gpt-4o-mini", "gpt-4o"];

  function chatCompletionsUrl() {
    if (typeof window.PH3A_OPENAI_PROXY_URL === "string" && window.PH3A_OPENAI_PROXY_URL) {
      return window.PH3A_OPENAI_PROXY_URL;
    }
    if (window.PH3A_USE_PROXY === true) {
      var host = typeof location !== "undefined" ? location.hostname : "";
      if (host === "localhost" || host === "127.0.0.1") {
        return location.origin + "/api/openai/chat";
      }
    }
    return "https://api.openai.com/v1/chat/completions";
  }

  function loadOpenAiKey() {
    try {
      return localStorage.getItem(OPENAI_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveOpenAiKey(key) {
    try {
      if (key) localStorage.setItem(OPENAI_STORAGE_KEY, key.trim());
      else localStorage.removeItem(OPENAI_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  function formatApiError(status, data) {
    const err = data && data.error;
    const msg = (err && err.message) || JSON.stringify(data);
    const code = (err && err.code) || "";

    if (status === 401 || /invalid_api_key|Incorrect API key/i.test(msg)) {
      return "Chave OpenAI inválida. Confira em platform.openai.com/api-keys ou use Templates locais.";
    }
    if (status === 429 || /rate_limit|insufficient_quota/i.test(msg + code)) {
      return (
        "Limite ou cota OpenAI (429). Verifique billing em platform.openai.com — ou use «Templates locais»."
      );
    }
    return "Erro OpenAI " + status + ": " + String(msg).slice(0, 500);
  }

  function corsHint(e) {
    if (String(e).includes("Failed to fetch")) {
      return (
        "Não foi possível chamar a OpenAI (CORS). Abra via Live Server ou defina PH3A_USE_PROXY=true + python proxy-server.py."
      );
    }
    return String(e);
  }

  function chatCompletion(apiKey, prompt) {
    var lastError = null;
    var models = OPENAI_MODELS.slice();
    var idx = 0;

    function tryModel() {
      if (idx >= models.length) {
        return Promise.reject(new Error(lastError || "Nenhum modelo OpenAI disponível."));
      }
      var model = models[idx++];

      return fetch(chatCompletionsUrl(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + apiKey.trim(),
        },
        body: JSON.stringify({
          model: model,
          temperature: 0.85,
          max_tokens: 4096,
          messages: [
            { role: "system", content: prompt.system },
            { role: "user", content: prompt.user },
          ],
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
            var text =
              data &&
              data.choices &&
              data.choices[0] &&
              data.choices[0].message &&
              data.choices[0].message.content;
            if (!text) throw new Error("Resposta vazia da OpenAI.");
            return { text: text, model: model };
          });
        })
        .catch(function (e) {
          if (e.message && e.message.indexOf("Failed to fetch") === -1 && e.message.indexOf("Erro OpenAI") === 0) {
            throw e;
          }
          lastError = e.message || corsHint(e);
          throw new Error(lastError);
        });
    }

    return tryModel();
  }

  function cleanNarrativeLabel(raw, index) {
    var s = String(raw || "")
      .trim()
      .replace(/^ângulo\s*\d+\s*[:\-—–]\s*/i, "")
      .replace(/^opção\s*\d+\s*[:\-—–]\s*/i, "");
    return (s || "Opção " + (index + 1)).slice(0, 80);
  }

  function parseNarrativesJson(raw, opts) {
    var jsonStr = raw.trim();
    var fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fence) jsonStr = fence[1].trim();

    var arr = null;
    try {
      var obj = JSON.parse(jsonStr);
      if (Array.isArray(obj)) arr = obj;
      else if (obj && Array.isArray(obj.narratives)) arr = obj.narratives;
    } catch {
      /* fallback abaixo */
    }

    if (!arr) {
      var start = jsonStr.indexOf("[");
      var end = jsonStr.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("OpenAI não retornou JSON em array.");
      arr = JSON.parse(jsonStr.slice(start, end + 1));
    }

    if (!Array.isArray(arr) || arr.length < 1) throw new Error("Array de narrativas vazio.");

    return arr.slice(0, 5).map(function (item, i) {
      var s = item.scenes || {};
      var c2f = Array.isArray(s.c2f) ? s.c2f : ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"];
      return {
        id: "openai-" + i,
        label: cleanNarrativeLabel(item.label, i),
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

  function buildPrompt(opts) {
    var excerpt = opts.baseText.slice(0, 6000);
    var profileHints = {
      datatag:
        "Marketing digital: leads, visitantes anônimos, CAC, CPL, funil Visitante→Identidade→Score→Prioridade.",
      datafraud:
        "Antifraude: Evento→Validação→Dados→Decisão. Abertura: fraude na internet (marketing), evitar jargão 'regras genéricas'.",
      databusca: "Busca/enriquecimento PF/PJ, cadastro incompleto, localizar.",
      datadossie: "Dossiê: risco, reputação, compliance, screening, due diligence.",
      datacob: "Cobrança: recuperação de crédito, priorização de inadimplentes.",
      datarc6: "RC6: registro e consulta regulatória, conformidade, trilha auditável.",
      generic: "Produto B2B PH3A.",
    };

    var system =
      "Você cria narrativas para vídeo PH3A (CUBO-PH). pt-BR, marketing B2B, textos curtos on-screen, sem inglês, sem by PH3A.\n" +
      (profileHints[opts.profile] || profileHints.generic) +
      '\nResponda APENAS JSON válido: {"narratives":[ ...5 objetos... ]} cada um com label (título curto só, sem "Ângulo" nem numeração), scenes{c1t,c1s,c2t,c2f[4 strings],c3a,c3b}, narration.';

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
      " — proponha 5 narrativas com abordagens DIFERENTES.\n\nBase:\n" +
      excerpt;

    return { system: system, user: user };
  }

  function fetchNarrativesFromOpenAi(apiKey, opts) {
    return chatCompletion(apiKey, buildPrompt(opts)).then(function (r) {
      return parseNarrativesJson(r.text, opts);
    });
  }

  function testOpenAiKey(apiKey) {
    return chatCompletion(apiKey, {
      system: "Responda só: OK",
      user: "teste",
    }).then(function (r) {
      return "Modelo " + r.model + ": " + r.text.trim().slice(0, 40);
    });
  }

  function isQuotaErrorMessage(msg) {
    return /429|quota|rate limit|insufficient_quota|cota/i.test(msg || "");
  }

  global.Ph3aOpenAI = {
    loadOpenAiKey: loadOpenAiKey,
    saveOpenAiKey: saveOpenAiKey,
    testOpenAiKey: testOpenAiKey,
    chatCompletion: chatCompletion,
    parseNarrativesJson: parseNarrativesJson,
    fetchNarrativesFromOpenAi: fetchNarrativesFromOpenAi,
    isQuotaErrorMessage: isQuotaErrorMessage,
  };
})(typeof window !== "undefined" ? window : globalThis);
