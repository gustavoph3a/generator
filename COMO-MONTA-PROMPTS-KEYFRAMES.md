# Como a ferramenta monta identidade do mascote e prompts de keyframe

Documento para o time (produto, design, operação). Explica **de onde vem cada parte** do texto que vai para o ChatGPT ou para a API de imagens, e **o que enviar** para quem for gerar os PNGs.

**Ferramenta:** `ferramenta-textos/index.html`  
**Código principal:** `app.js` (montagem de texto) · `keyframes-api.js` (geração por API, §5)  
**Processo geral do vídeo:** `../PROCESSO-VIDEOS-PH3A.md`

---

## Visão em uma frase

A ferramenta **não “lê” o PDF inteiro** na hora de montar cada keyframe. Ela combina três fontes:

1. **Identidade fixa PH3A** — mascote CUBO-PH, cores, estilo 2D (sempre igual).
2. **Conteúdo da narrativa** — títulos, subtítulos e fluxo das 4 cenas (escolhidos no §2).
3. **Metáforas visuais por produto** — ícones e elementos de cena (DataFraud ≠ DataBusca).

O arquivo entregue ao colega é **`prompts-chatgpt-keyframes.txt`** (§4 da ferramenta).

---

## Fluxo completo (etapas 1 → 4)

```
PDF / base-txt/{produto}-base.txt
        │
        ▼  §1 — escolher produto e carregar base
        │
        ▼  §2 — gerar 5 narrativas (local ou Gemini)
        │         cada narrativa vira um objeto "scenes"
        │
        ▼  §3 — (opcional) escolher vertente Flow para roteiro de vídeo
        │
        ▼  §4 — Gerar arquivos .txt
        │
        └──► prompts-chatgpt-keyframes.txt  ──► colega cola no ChatGPT + anexa mascote
```

A **base do produto** (`base-txt/datafraud-base.txt`, etc.) alimenta principalmente:

- narrativas geradas por **Gemini** (§2, se usar IA); ou
- contexto humano ao escolher uma das **5 narrativas locais** (já escritas no código por produto).

Ela **não** entra linha a linha no prompt de imagem. O que entra no keyframe são os campos **`scenes`** da narrativa escolhida + regras fixas + dicas visuais do perfil do produto.

---

## Parte 1 — Identidade do mascote (fidelidade visual)

### O que é

Tudo que manda a IA **desenhar o CUBO-PH igual** em todos os vídeos PH3A: formato, cores, antena, olhos na tela, nuvem, estilo flat, fundo charcoal, blobs laranja.

### Onde está no código

| Peça | Arquivo | Função / constante |
|------|---------|-------------------|
| Descrição completa do personagem + estilo global | `app.js` | constante **`CUBO_PH`** |
| Regras de ouro (pt-BR, sem lightning, ortografia exata, sem dados reais) | `app.js` | constante **`RULES`** |
| Briefing mestre (PARTE 1 do `.txt`) | `app.js` | **`buildBriefingBlock(n)`** — inclui `CUBO_PH` + `RULES` |
| Layout do mascote em cada KF (posição, expressão) | `app.js` | **`buildKeyframeBlock(n, num)`** — trechos fixos por KF1–4 |
| Reforço na API (§5) | `app.js` | **`buildKeyframePromptForApi()`** — bloco **EXECUÇÃO** |
| Referência visual real (fotos) | `mascot-base/*.jpeg` + §5 | **`images/edits`** em `keyframes-api.js` |

### Texto fixo da identidade (`CUBO_PH`)

Resumo do que está codificado (não muda por produto):

- Cubo ~1:1:1, cantos arredondados, corpo **charcoal/preto fosco**, bordas e detalhes **laranja #E94E1B**.
- Face = **tela** no cubo com olhos kawaii 2D e boca simples.
- **Antena** preta + esfera laranja no topo.
- Braços/pernas flutuantes com **anéis laranja** nas juntas.
- Flutua sobre **nuvem cream #F5F1EA**.
- Estilo: **ilustração 2D flat** tech-cute (não 3D metálico).
- Fundo padrão: **charcoal #1a1a1a** + blobs orgânicos laranja nos cantos.
- Tipografia on-screen: **cream #F5F1EA**, sans bold arredondada, 16:9.

### Onde isso aparece no arquivo para o colega

No **`prompts-chatgpt-keyframes.txt`**, bloco:

```
────────────────────────────────────────
PARTE 1 — COLE PRIMEIRO (BRIEFING MESTRE)
────────────────────────────────────────
```

Esse bloco deve ser colado **uma vez** na conversa do ChatGPT, **antes** de pedir KEYFRAME 1, 2, 3 ou 4.

### Fotos do mascote (importante)

O texto diz *“CUBO-PH idêntico ao mascote anexado”*, mas a fidelidade máxima vem das **4 imagens de referência** (`mascot-base/` ou WhatsApp do mascote).

| Canal | Como a referência entra |
|-------|-------------------------|
| **ChatGPT (manual)** | Anexar JPEGs na mensagem junto com o prompt |
| **API §5 (ferramenta)** | Envia as mesmas fotos em `POST /v1/images/edits` (não só texto) |

Sem fotos, o modelo **interpreta** a descrição escrita e o mascote pode divergir.

### Expressão e posição por keyframe (também identidade / layout)

Fixo em `buildKeyframeBlock`, independente da narrativa:

| Keyframe | Mascote | Layout |
|----------|---------|--------|
| **KF1** | Preocupado/triste | À esquerda, nuvem cream |
| **KF2** | Focado | Aponta fluxo horizontal (4 nós) |
| **KF3** | Feliz | Leve “bounce” |
| **KF4** | Feliz, centralizado | Assinatura PH3A embaixo |

---

## Parte 2 — O que vem do produto / do texto (conteúdo da cena)

### Caminho dos dados

```
base-txt/{produto}-base.txt     ← conhecimento do produto (PDF filtrado)
              │
              ├─► Gemini (§2)     ← opcional: IA propõe 5 narrativas novas
              │
              └─► buildNarratives() ← padrão: 5 narrativas locais por produto
                        │
                        ▼
              narrativa escolhida no §2
                        │
                        ├── scenes.c1t, c1s   → textos KF1
                        ├── scenes.c2t, c2f[] → textos + fluxo KF2
                        ├── scenes.c3a, c3b   → textos KF3
                        ├── tagline           → frase KF4
                        ├── label             → nome da narrativa
                        ├── productDisplay    → DATAFRAUD, DATABUSCA…
                        └── profile           → datafraud, databusca…
                                      │
                                      ▼
                        sceneVisualHints(profile) → ícones/metáforas KF1–4
```

### Objeto `scenes` (coração do conteúdo)

Cada narrativa do §2 carrega estes campos:

| Campo | Significado | Usado em |
|-------|-------------|----------|
| `c1t` | Título grande KF1 (problema) | KEYFRAME 1 |
| `c1s` | Subtítulo KF1 | KEYFRAME 1 |
| `c2t` | Título KF2 (ação) | KEYFRAME 2 |
| `c2f` | Array com 4 etapas do fluxo | KEYFRAME 2 (lista numerada) |
| `c3a`, `c3b` | Duas linhas de benefício | KEYFRAME 3 |
| `tagline` | Frase de assinatura | KEYFRAME 4 |
| `label` | Nome curto da narrativa | Cabeçalho de cada KEYFRAME |
| `productDisplay` | Nome do produto em caps | Cabeçalho + KF4 |

**Origem local:** função `buildNarratives(profile, …)` em `app.js` — banco de narrativas por produto (`datafraud`, `databusca`, `datatag`, etc.).

**Origem Gemini:** `gemini.js` → `parseNarrativesJson()` — mesma estrutura `scenes`, gerada a partir do trecho da base enviada ao Gemini.

**Exemplo DataFraud — narrativa “Fraude em todo lugar”:**

```text
c1t: "A FRAUDE ESTÁ EM TODO LUGAR"
c1s: "Cadastros. Transações. Apps."
c2t: "SUA POLÍTICA DE RISCO"
c2f: ["Evento", "Validação", "Dados", "Decisão"]
c3a: "DECISÃO RASTREÁVEL"
c3b: "MENOS FALSOS POSITIVOS"
tagline: "O DataFraud não decide pelo cliente. Ele executa a política do cliente."
```

### Metáforas visuais por produto (`sceneVisualHints`)

Além dos textos `scenes`, o código adiciona **o que desenhar ao lado do mascote**, por **perfil do produto** (não por narrativa individual).

Função: **`sceneVisualHints(profile, scenes)`** em `app.js`.

| Produto (`profile`) | KF1 (exemplo do que pede) |
|---------------------|---------------------------|
| **datafraud** | Ícones digitais com alerta (!), card “Tentativa suspeita” |
| **databusca** | Fichas PF/PJ incompletas, callouts cadastro/desatualizado |
| **datacob** | Carteira de títulos, fila longa, telefone sem resposta |
| **datatag** | Pilha de cards de leads, silhuetas saindo do site |
| **datadossie** | Dossiê com lacunas, lupa, alertas discretos |
| **datarc6** | Documento regulatório, selo RC6, checklist |

KF2–4 também têm `k2`, `k3`, `k4` específicos por produto (workflow, badges, mini-assinatura, etc.). Parte deles reutiliza `scenes.c2f` no meio da frase.

### O que a base `.txt` **não** faz diretamente

- Não é colada inteira no prompt de imagem.
- Serve para **contexto** ao gerar narrativas (Gemini) e para **roteiros Flow** (`roteiro-flow.txt`), que são outro arquivo.

Se o colega precisar **mudar só o copy** (“A FRAUDE ESTÁ…” → outra frase), isso vem da **narrativa §2**, não de editar o PDF.

Se precisar **mudar ícones do KF1** (ex.: trocar “Tentativa suspeita” por outra metáfora para todo DataFraud), edita-se **`sceneVisualHints("datafraud")`** no código — ou pede-se ajuste manual no ChatGPT após colar o prompt.

---

## Parte 3 — Como o keyframe final é montado

### Três funções encadeadas

| Função | O que produz | Identidade ou conteúdo? |
|--------|--------------|-------------------------|
| **`buildBriefingBlock(n)`** | PARTE 1 do `.txt` | **Misto:** identidade (`CUBO_PH`, `RULES`) + resumo do arco 4 cenas (`scenes`) |
| **`buildKeyframeBlock(n, num)`** | Bloco KEYFRAME 1…4 | **Misto:** template fixo + `scenes` + `sceneVisualHints` |
| **`buildPromptsFile(n)`** | Arquivo completo exportado | Junta briefing + KF1 + KF2 + KF3 + KF4 + instruções de anexo |

Para a **API §5**, ainda existe **`buildKeyframePromptForApi(n, num)`**: briefing + um KEYFRAME + bloco **EXECUÇÃO** (reforço “gere UMA imagem”, charcoal no cubo, etc.).

### Anatomia de um KEYFRAME 1 (exemplo)

Trecho **identidade / layout** (fixo no template):

```text
16:9 ilustração 2D flat PH3A. CUBO-PH idêntico ao mascote anexado: à esquerda, nuvem cream, expressão PREOCUPADA/Triste.
Fundo charcoal + blobs laranja nos cantos.
Sem lightning. Sem inglês. 1920×1080.
```

Trecho **conteúdo do produto / narrativa**:

```text
KEYFRAME 1 — DATAFRAUD · Fraude em todo lugar          ← productDisplay + label

Ícones digitais com alerta (!). Card "Tentativa suspeita". …  ← sceneVisualHints (datafraud)

Título grande cream bold: "A FRAUDE ESTÁ EM TODO LUGAR"      ← scenes.c1t
Subtítulo menor: "Cadastros. Transações. Apps."              ← scenes.c1s
```

A **fronteira** entre “ser fiel ao mascote” e “conteúdo desta cena” cai aproximadamente na linha do cabeçalho `KEYFRAME N — PRODUTO · narrativa`: acima e nas linhas de estilo/layout = identidade; títulos entre aspas + linha `v.kN` = conteúdo.

### Estrutura do arquivo entregue ao colega

Arquivo: **`prompts-chatgpt-keyframes.txt`** (gerado no §4).

```text
================================================================================
{PRODUTO} — PROMPTS PARA CHATGPT (gerar keyframes)
================================================================================

FERRAMENTA: ChatGPT (geração de imagem)
ANEXAR EM TODOS OS PEDIDOS: fotos do CUBO-PH (4 referências)
A partir do KEYFRAME 2: anexar também o keyframe anterior gerado.

────────────────────────────────────────
PARTE 1 — COLE PRIMEIRO (BRIEFING MESTRE)     ← identidade + arco + regras
────────────────────────────────────────
[texto de buildBriefingBlock]

────────────────────────────────────────
KEYFRAME 1 — Problema (0–2,5s)                ← conteúdo cena 1
────────────────────────────────────────
[texto de buildKeyframeBlock(n, 1)]

… KEYFRAME 2, 3, 4 …
```

---

## O que enviar ao colega (checklist)

1. **Arquivo** `prompts-chatgpt-keyframes.txt` da narrativa escolhida (§4).
2. **4 fotos** do mascote CUBO-PH (`ferramenta-textos/mascot-base/mascot_1.jpeg` … `mascot_4.jpeg`, ou as oficiais do time).
3. **Instruções de uso no ChatGPT:**
   - Colar **PARTE 1 (briefing mestre)** na primeira mensagem **com as 4 fotos anexadas**.
   - Pedir **KEYFRAME 1** (copiar só o bloco KF1) → **uma imagem** → salvar `keyframe_1.png`.
   - Para **KEYFRAME 2**: anexar de novo mascote + **`keyframe_1.png`** + colar bloco KF2.
   - Repetir até `keyframe_4.png`.
4. **Pasta de destino:** `video-novo/{produto}/` (ex.: `video-novo/datafraud/keyframe_1.png` … `keyframe_4.png`).
5. **Regras rápidas:** pt-BR only, textos **exatamente** como entre aspas, sem lightning, sem inglês.

Opcional: se usar **§5 API** na ferramenta em vez do ChatGPT, o colega precisa da **chave OpenAI** e abrir via `http://localhost:8080` (`python proxy-server.py`) com as fotos no painel §5.

---

## KF2, KF3 e KF4 (resumo do conteúdo vs identidade)

| KF | Conteúdo vem de… | Identidade / layout fixo |
|----|------------------|---------------------------|
| **2** | `c2t`, `c2f[]`, `v.k2` | Mesmo mascote do KF1, focado, pulso laranja suave, 4 nós |
| **3** | `c3a`, `c3b`, `v.k3` | Mascote feliz, badges conforme produto |
| **4** | `productDisplay`, `tagline`, `v.k4` | Mascote centralizado, “PH3A”, linha laranja |

---

## Onde editar cada tipo de mudança

| Quero mudar… | Onde |
|--------------|------|
| Aparência global do CUBO-PH | `CUBO_PH` em `app.js` |
| Regras (idioma, lightning, etc.) | `RULES` em `app.js` |
| Textos on-screen de uma narrativa | `buildNarratives()` ou narrativa Gemini (§2) |
| Ícones/metáforas de um produto | `sceneVisualHints(profile)` em `app.js` |
| Posição/expressão por KF | template em `buildKeyframeBlock()` |
| Tagline KF4 por produto | `DEFAULT_TAGLINES` ou base / escolha na UI |
| Conhecimento bruto do produto | `base-txt/{produto}-base.txt` |

---

## Referência rápida de arquivos

| Arquivo | Papel |
|---------|--------|
| `app.js` | Monta briefing, keyframes, narrativas, roteiros Flow |
| `gemini.js` | Narrativas via Gemini (mesma estrutura `scenes`) |
| `keyframes-api.js` | Geração §5 (`images/edits` com fotos) |
| `base-txt/*.txt` | Conhecimento por produto (entrada §1) |
| `mascot-base/*.jpeg` | Referência visual do mascote |
| `prompts-chatgpt-keyframes.txt` | **Saída §4** — entregar ao colega |
| `../PROCESSO-VIDEOS-PH3A.md` | Fluxo completo PDF → keyframes → Flow |

---

*Gerado para o projeto PH3A · ferramenta-textos · atualizado conforme `app.js` (buildBriefingBlock, buildKeyframeBlock, buildNarratives, sceneVisualHints).*
