/**

 * Geração de keyframes via OpenAI Images.

 * Com fotos do mascote: POST /v1/images/edits (referência visual — como ChatGPT).

 * Sem fotos: POST /v1/images/generations (só texto).

 */

(function (global) {

  function useLocalProxy() {

    return window.PH3A_USE_PROXY === true || Boolean(window.PH3A_OPENAI_PROXY_URL);

  }



  function apiBase() {

    var host = typeof location !== "undefined" ? location.hostname : "";

    if (useLocalProxy() && (host === "localhost" || host === "127.0.0.1")) {

      return location.origin;

    }

    return "";

  }



  function imagesGenerationsUrl() {

    if (typeof window.PH3A_OPENAI_IMAGES_URL === "string" && window.PH3A_OPENAI_IMAGES_URL) {

      return window.PH3A_OPENAI_IMAGES_URL;

    }

    if (window.PH3A_OPENAI_PROXY_URL) return window.PH3A_OPENAI_PROXY_URL;

    var base = apiBase();

    return base ? base + "/api/openai/images/generations" : "https://api.openai.com/v1/images/generations";

  }



  function imagesEditsUrl() {

    var base = apiBase();

    return base ? base + "/api/openai/images/edits" : "https://api.openai.com/v1/images/edits";

  }



  function chatUrl() {

    if (window.PH3A_OPENAI_PROXY_URL) return window.PH3A_OPENAI_PROXY_URL;

    var base = apiBase();

    return base ? base + "/api/openai/chat" : "https://api.openai.com/v1/chat/completions";

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



  function fetchImageProxyUrl() {

    if (!useLocalProxy()) return null;

    var base = apiBase();

    return base ? base + "/api/openai/fetch-image" : null;

  }



  function imageUrlToDataUrl(apiKey, imageUrl) {

    var proxy = fetchImageProxyUrl();

    if (!proxy) {

      return fetch(imageUrl)

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

        })

        .catch(function () {

          return Promise.reject(

            new Error(

              "Não foi possível baixar a imagem. Ative PH3A_USE_PROXY=true e python proxy-server.py."

            )

          );

        });

    }

    return fetch(proxy, {

      method: "POST",

      headers: authHeaders(apiKey, "application/json"),

      body: JSON.stringify({ url: imageUrl }),

    }).then(function (res) {

      return res.json().then(function (data) {

        if (!res.ok) throw new Error(formatErr(res.status, data));

        if (data.data_url) return data.data_url;

        if (data.b64) return "data:image/png;base64," + data.b64;

        throw new Error("Proxy não retornou imagem.");

      });

    });

  }



  var IMAGE_MODEL_CANDIDATES = [

    { model: "gpt-image-2", size: "1536x1024", quality: "high" },

    { model: "gpt-image-1.5", size: "1536x1024", quality: "high" },

    { model: "gpt-image-1", size: "1536x1024", quality: "high" },

    { model: "gpt-image-1-mini", size: "1536x1024", quality: "high" },

    { model: "dall-e-3", size: "1792x1024", quality: "hd" },

  ];



  function imageModelList() {

    if (typeof window.PH3A_IMAGE_MODEL === "string" && window.PH3A_IMAGE_MODEL.trim()) {

      var forced = window.PH3A_IMAGE_MODEL.trim();

      var found = IMAGE_MODEL_CANDIDATES.filter(function (c) {

        return c.model === forced;

      });

      if (found.length) return found;

      return [{ model: forced, size: "1536x1024", quality: "high" }].concat(IMAGE_MODEL_CANDIDATES);

    }

    return IMAGE_MODEL_CANDIDATES.slice();

  }



  function modelsForEdits() {

    return imageModelList().filter(function (c) {

      return c.model.indexOf("dall-e") !== 0;

    });

  }



  function isRetryableModelError(data) {

    var msg = ((data && data.error && data.error.message) || "").toLowerCase();

    var code = (data && data.error && data.error.code) || "";

    return (

      /does not exist|invalid_value|unknown parameter|not found|deprecated/i.test(msg) ||

      code === "invalid_value" ||

      code === "unknown_parameter"

    );

  }



  function parseImageItem(apiKey, item) {

    if (!item) throw new Error("OpenAI não retornou imagem.");

    if (item.b64_json) return Promise.resolve("data:image/png;base64," + item.b64_json);

    if (item.url) return imageUrlToDataUrl(apiKey, item.url);

    return Promise.reject(new Error("Resposta sem url nem b64_json."));

  }



  function dataUrlToBlob(dataUrl) {

    return fetch(dataUrl).then(function (r) {

      return r.blob();

    });

  }



  function dataUrlToProxyPayload(dataUrl, index) {

    var m = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);

    if (!m) return Promise.reject(new Error("Data URL inválida na referência " + (index + 1)));

    var ext = m[1].indexOf("jpeg") >= 0 || m[1].indexOf("jpg") >= 0 ? "jpeg" : "png";

    return Promise.resolve({

      filename: "ref" + (index + 1) + "." + ext,

      content_type: m[1],

      b64: m[2],

    });

  }



  function isCustomAvatarKf() {
    return (
      typeof window !== "undefined" &&
      window.Ph3aAvatarState &&
      Ph3aAvatarState.getMode() === "custom" &&
      Ph3aAvatarState.hasCustomAvatar()
    );
  }

  function isHumanAvatarKf() {
    if (!isCustomAvatarKf()) return false;
    var ctx = Ph3aAvatarState.getProfileCtx();
    return ctx && ctx.avatarKind === "human";
  }

  /** Prefixo quando as fotos vão no multipart (edits) — equivalente a anexar no ChatGPT. */
  function buildEditPromptPrefix(mascotCount, hasPrevKeyframe) {
    var n = Math.max(1, mascotCount);
    var parts;

    if (isCustomAvatarKf()) {
      var name = Ph3aAvatarState.getCharacterName();
      var style = Ph3aAvatarState.getStyleHint();
      parts = [
        "As imagens anexadas (imagem 1" +
          (n > 1 ? " a imagem " + n : "") +
          ") mostram o mascote personalizado " +
          name +
          " (PH3A).",
        "Gere UMA ilustração NOVA 16:9 (1920×1080), " + style + ".",
        name +
          " deve manter a MESMA IDENTIDADE das referências (personagem, proporções, paleta, roupa) — NÃO copiar pose nem composição do sheet.",
        "O avatar sheet é referência de IDENTIDADE (personagem, cores, proporções), NÃO de expressão fixa: olhos/sobrancelhas/boca (humano) ou olhos/rosto do mascote (tela do rosto, se houver) DEVEM seguir o texto do KEYFRAME abaixo — pode diferir do PNG anexado.",
        isHumanAvatarKf()
          ? "Personagem humano: não repetir o mesmo sorriso do sheet em todos os keyframes se o prompt pedir outra emoção."
          : "Mascote abstrato: emoção nos olhos/expressão do personagem conforme cada KEYFRAME, não travar a feição do sheet.",
        "Use SOMENTE " +
          name +
          " como mascote. PROIBIDO adicionar CUBO-PH, cubo robô PH3A ou qualquer segundo personagem/mascote.",
        "Não copie fundo nem composição das referências — apenas a identidade do personagem.",
      ];
      if (hasPrevKeyframe) {
        parts.push(
          "A última imagem anexada é o keyframe anterior: mesmo " +
            name +
            " (identidade e estilo), MAS feição e pose deste keyframe conforme o prompt — expressão pode mudar em relação ao frame anterior."
        );
      }
    } else {
      parts = [
        "As imagens anexadas (imagem 1" + (n > 1 ? " a imagem " + n : "") + ") mostram o mascote CUBO-PH da PH3A.",
        "Gere UMA ilustração NOVA 16:9 (1920×1080), estilo 2D flat editorial tech-cute.",
        "O CUBO-PH deve ser visualmente idêntico ao das referências: cubo charcoal/preto fosco, bordas e glow laranja #E94E1B, antena preta com esfera laranja, olhos kawaii na tela do cubo, braços/pernas flutuantes com anéis laranja, nuvem cream #F5F1EA.",
        "Não copie fundo nem composição das referências — apenas o personagem.",
      ];
      if (hasPrevKeyframe) {
        parts.push(
          "A última imagem anexada é o keyframe anterior desta série: mantenha o mesmo mascote e a mesma paleta PH3A."
        );
      }
    }

    return parts.join(" ") + "\n\n";
  }



  function postGenerations(apiKey, spec, prompt) {

    var body = { model: spec.model, prompt: prompt, n: 1 };

    if (spec.size) body.size = spec.size;

    if (spec.quality) body.quality = spec.quality;

    return fetch(imagesGenerationsUrl(), {

      method: "POST",

      headers: authHeaders(apiKey, "application/json"),

      body: JSON.stringify(body),

    });

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



  function runImageModels(apiKey, models, attemptFn) {

    var idx = 0;

    var lastError = null;



    function tryModel() {

      if (idx >= models.length) {

        return Promise.reject(

          new Error(

            lastError ||

              "Nenhum modelo de imagem disponível. Tente PH3A_IMAGE_MODEL em config.local.js."

          )

        );

      }

      var spec = models[idx++];

      return attemptFn(spec).then(function (res) {

        return res.json().then(function (data) {

          if (!res.ok) {

            lastError = formatErr(res.status, data);

            if (isRetryableModelError(data)) return tryModel();

            throw new Error(lastError);

          }

          return parseImageItem(apiKey, data.data && data.data[0]).then(function (dataUrl) {

            return { dataUrl: dataUrl, model: spec.model, mode: attemptFn.mode };

          });

        });

      }).catch(function (e) {

        if (e.message && e.message.indexOf("Erro OpenAI") === 0) throw e;

        lastError = e.message || String(e);

        return tryModel();

      });

    }



    return tryModel();

  }



  function generateWithEdits(apiKey, prompt, referenceDataUrls) {

    var mascotRefs = referenceDataUrls.mascot.slice(0, 4);

    var prev = referenceDataUrls.prev;

    var allUrls = mascotRefs.slice();

    if (prev) allUrls.push(prev);



    var editPrompt =

      buildEditPromptPrefix(mascotRefs.length, Boolean(prev)) + String(prompt || "").trim();



    var models = modelsForEdits();

    if (!models.length) models = IMAGE_MODEL_CANDIDATES.slice();



    return Promise.all(allUrls.map(dataUrlToBlob)).then(function (blobs) {

        var viaProxy = Boolean(apiBase());

        runImageModels.mode = "edits";

        return runImageModels(apiKey, models, function (spec) {

          if (viaProxy) {

            return postEditsViaProxy(apiKey, spec, editPrompt, allUrls);

          }

          return postEditsDirect(apiKey, spec, editPrompt, blobs);

        });

      })

      .then(function (r) {

        return r.dataUrl;

      });

  }



  function generateWithGenerations(apiKey, prompt) {

    var models = imageModelList();

    runImageModels.mode = "generations";

    return runImageModels(apiKey, models, function (spec) {

      return postGenerations(apiKey, spec, String(prompt || "").trim());

    }).then(function (r) {

      return r.dataUrl;

    });

  }



  /**

   * @param {string} apiKey

   * @param {string} textPrompt — briefing + keyframe (Ph3aApp.getKeyframePromptForApi)

   * @param {{ referenceDataUrls?: string[], prevKeyframeDataUrl?: string|null }} [options]

   */

  function generateKeyframeImage(apiKey, textPrompt, options) {

    options = options || {};

    var mascot = (options.referenceDataUrls || []).filter(Boolean);

    var prev = options.prevKeyframeDataUrl || null;



    if (mascot.length > 0) {

      return generateWithEdits(apiKey, textPrompt, { mascot: mascot, prev: prev });

    }

    return generateWithGenerations(apiKey, textPrompt);

  }



  /** Legado: visão só se não houver fotos e quiser fallback manual. */

  function describeMascotFromImages(apiKey, dataUrls) {

    if (!dataUrls.length) return Promise.resolve("");

    var content = [

      {

        type: "text",

        text:

          isCustomAvatarKf()

            ? "Descreva em português, em um parágrafo técnico para prompt de ilustração, o mascote personalizado destas imagens (identidade visual PH3A). Descreva apenas este personagem — sem inventar CUBO-PH ou cubo robô. Sem inventar elementos que não aparecem."

            : "Descreva em português, em um parágrafo técnico para prompt de ilustração, o mascote CUBO-PH destas imagens: formato do cubo, cores (#1a1a1a charcoal, laranja #E94E1B), antena, olhos na tela, nuvem cream, estilo 2D flat PH3A. Sem inventar elementos que não aparecem.",

      },

    ];

    dataUrls.slice(0, 4).forEach(function (url) {

      content.push({ type: "image_url", image_url: { url: url, detail: "low" } });

    });

    return fetch(chatUrl(), {

      method: "POST",

      headers: authHeaders(apiKey, "application/json"),

      body: JSON.stringify({

        model: "gpt-4o-mini",

        max_tokens: 500,

        messages: [{ role: "user", content: content }],

      }),

    }).then(function (res) {

      return res.json().then(function (data) {

        if (!res.ok) throw new Error(formatErr(res.status, data));

        var text =

          data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        return (text || "").trim();

      });

    });

  }



  function describePrevKeyframeForConsistency(apiKey, dataUrl) {

    if (!dataUrl) return Promise.resolve("");

    return fetch(chatUrl(), {

      method: "POST",

      headers: authHeaders(apiKey, "application/json"),

      body: JSON.stringify({

        model: "gpt-4o-mini",

        max_tokens: 400,

        messages: [

          {

            role: "user",

            content: [

              {

                type: "text",

                text:

                  isCustomAvatarKf()

                    ? "Keyframe PH3A já gerada. Em português, 3–5 frases: descreva APENAS o mascote personalizado visível (mesmo personagem do avatar sheet). Não descreva CUBO-PH, cubo robô, textos on-screen nem mude o layout."

                    : "Keyframe PH3A já gerada. Em português, 3–5 frases: descreva APENAS o CUBO-PH (cores charcoal/laranja/cream, antena, face na tela, nuvem) e o estilo 2D flat. Não descreva textos on-screen nem mude o layout.",

              },

              { type: "image_url", image_url: { url: dataUrl, detail: "low" } },

            ],

          },

        ],

      }),

    }).then(function (res) {

      return res.json().then(function (data) {

        if (!res.ok) throw new Error(formatErr(res.status, data));

        var text =

          data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        return (text || "").trim();

      });

    });

  }



  global.Ph3aKeyframeImages = {

    describeMascotFromImages: describeMascotFromImages,

    describePrevKeyframeForConsistency: describePrevKeyframeForConsistency,

    generateKeyframeImage: generateKeyframeImage,

    IMAGE_MODEL_CANDIDATES: IMAGE_MODEL_CANDIDATES,

  };

})(typeof window !== "undefined" ? window : globalThis);


