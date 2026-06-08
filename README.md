# Ferramenta de textos PH3A (local)

Gera **5 narrativas**, **prompts-chatgpt-keyframes.txt** e **roteiros Flow** no navegador. Imagens continuam no **ChatGPT**.

**Como o texto do keyframe é montado (mascote vs conteúdo do produto):** ver [`COMO-MONTA-PROMPTS-KEYFRAMES.md`](COMO-MONTA-PROMPTS-KEYFRAMES.md).

**Criar avatar antes dos keyframes (refs + paleta + 2 variantes):** [`avatar.html`](avatar.html) · **Studio v2 (abas Avatar + Keyframes):** [`index_v2.html`](index_v2.html).

## Pasta `base-txt/` (bases prontas)

Bases de conhecimento **por produto**, já extraídas do PDF PH3A, para carregar na ferramenta sem procurar arquivo:

| Arquivo | Produto |
|---------|---------|
| `base-txt/databusca-base.txt` | DataBusca |
| `base-txt/datatag-base.txt` | DataTag |
| `base-txt/datafraud-base.txt` | DataFraud |
| `base-txt/datadossie-base.txt` | DataDossiê |
| `base-txt/datacob-base.txt` | DataCob |
| `base-txt/datarc6-base.txt` | DataRC6 |

Índice: `base-txt/INDICE.txt` · metadados: `base-txt/bases-manifest.json`

Na interface: **Carregar base pronta** (funciona com `http://localhost:8080`) ou **Enviar arquivo** apontando para um `.txt` em `base-txt/`.

---

## Como as bases foram extraídas do PDF

### Fonte

- **Arquivo:** `video-novo/PH3A_Base_de_Conhecimento_Completa 1.pdf` (documento único com vários produtos PH3A).
- **Objetivo:** um `.txt` **só com o produto** do vídeo, para IAs não misturarem DataTag com DataFraud, etc.

### Método (o que foi feito na prática)

1. **Localizar o produto no PDF**  
   Pelo sumário (ex.: cap. 07 DataTag, DataBusca, DataFraud) e pelas páginas onde o nome do produto aparece de forma sustentada (não só em lista de portfólio).

2. **Extrair texto**  
   Texto das páginas daquele capítulo (ferramenta de PDF ou script Python com biblioteca tipo `pypdf` / `pdfplumber`).  
   Referência de páginas DataTag: ver `video-novo/_extract_datatag.txt` (log de extração: páginas que mencionam DataTag).

3. **Filtrar — o que entra**  
   - Visão, problema de mercado, como funciona, módulos, diferenciais, resultados, mensagens-chave para vendas/vídeo.  
   - Slogans e taglines em português.  
   - Termos úteis para roteiro (CAC, CPL, visitantes anônimos, workflow de risco, etc.).

4. **Filtrar — o que foi ignorado / removido**  
   - **Outros produtos PH3A** no mesmo PDF (ex.: ao montar DataTag, remover trechos de DataFraud, DataBusca, DataCuboBI…).  
   - **Seções longas de LGPD/compliance** quando não são necessárias para roteiro de vídeo curto (ex.: DataTag — removido bloco LGPD extenso; mantida só menção ética se existir no capítulo de produto).  
   - **Tabelas de preço/planos** detalhadas (Starter/Pro/Enterprise) — opcional; podem entrar resumo, não tabela gigante.  
   - **DataCuboBI** — ainda sem `.txt` nesta pasta.  
   - **Material fora de `video-novo/`** (site Civic, outros projetos) — não entra na base.

5. **Normalizar o `.txt`**  
   - Cabeçalho padrão: nome do produto, “extraída PH3A”, arquivo PDF fonte, aviso “conteúdo apenas {Produto}”.  
   - Seções numeradas (SEÇÃO 1, 2…) para a IA achar contexto.  
   - Quebras de linha legíveis; sem lixo de OCR excessivo quando possível.

6. **Validar**  
   - Buscar no `.txt` se ainda aparece nome de **outro** produto como protagonista → cortar.  
   - Conferir tagline/slogan oficial para cena 4 do vídeo.

### Produtos no PDF vs `base-txt/`

| Produto no PDF | Base em `base-txt/` |
|----------------|---------------------|
| DataBusca | `databusca-base.txt` |
| DataTag | `datatag-base.txt` |
| DataFraud | `datafraud-base.txt` |
| DataDossiê | `datadossie-base.txt` |
| DataCob | `datacob-base.txt` |
| DataRC6 | `datarc6-base.txt` |
| DataCuboBI | pendente |

Para **novo produto:** repetir passos 1–6 no PDF → salvar `base-txt/{produto}-base.txt` → adicionar entrada em `bases-manifest.json`.

### Cópias na raiz `video-novo/`

Os mesmos arquivos existem também em `video-novo/datatag-base.txt`, `databusca-base.txt`, `datafraud/datafraud-base.txt`.  
A pasta **`ferramenta-textos/base-txt/`** é a cópia **oficial para upload na ferramenta**; ao atualizar a base, atualize aqui (e opcionalmente na raiz).

---

## OpenAI / ChatGPT API (opcional — narrativas)

1. Chave em [platform.openai.com/api-keys](https://platform.openai.com/api-keys) (formato `sk-…`).
2. Cole em `config.local.js` como `PH3A_OPENAI_KEY_DEFAULT` ou use o painel na página → **Salvar** → **Testar**.
3. Marque **ChatGPT (OpenAI API)** → **Gerar 5 narrativas**.

Usa `gpt-4o-mini` (fallback `gpt-4o`). **Não gera imagens** — keyframes continuam no site ChatGPT.

**Servidor com proxy** (recomendado para OpenAI — o navegador não chama api.openai.com direto):

```bash
python proxy-server.py
```

Abra `http://localhost:8080`. O `python -m http.server 8080` sozinho não repassa a API OpenAI.

## §5 Keyframes por API (opcional)

Gera `keyframe_1.png` … `keyframe_4.png` com **OpenAI Images** — padrão **`gpt-image-2`** (melhor qualidade; substitui o DALL·E 3 na API). Se falhar, tenta `gpt-image-1.5`, `gpt-image-1`, `gpt-image-1-mini`.

1. `python proxy-server.py` + chave OpenAI configurada.
2. §2 — escolha a narrativa.
3. §5 — arraste fotos do mascote; clique **KF 1** … **KF 4** ou **Gerar 1–2** / **Gerar 3–4** (um par por vez, controla custo).
4. Baixe cada imagem ou **Baixar os 4**.

Os passos 1–4 (textos/roteiros) continuam iguais; o `prompts-chatgpt-keyframes.txt` do §4 segue disponível para quem preferir o ChatGPT manual.

## Gemini (opcional)

1. Chave em [Google AI Studio](https://aistudio.google.com/app/apikey) (grátis).
2. Cole → **Salvar chave** → **Testar conexão**.
3. Marque **Gemini** → **Gerar 5 narrativas**.

Chaves padrão (só no seu PC): edite `config.local.js` (não vai para o Git).

### Erro 429 / `limit: 0` (você não “gastou” — a chave não tem cota)

Significa que o **projeto Google ligado à chave** não tem quota do tier gratuito da API (comum com chaves `AQ.…` ou projeto Cloud sem Generative Language API).

**O que fazer:**

1. **Use «Templates locais»** na ferramenta — funciona igual para narrativas + roteiros, sem API.
2. No [AI Studio](https://aistudio.google.com/app/apikey): **apague** a chave atual → **Create API key** de novo (prefira formato **`AIza…`**).
3. Confira uso: https://ai.dev/rate-limit  
4. Se continuar `limit: 0`, pode ser conta/região — aí o Gemini API free não está disponível; fique nos templates locais ou use o chat em aistudio.google.com (interface web, outra cota).

A ferramenta, se o Gemini falhar, **cai automaticamente** nos templates locais.

```powershell
cd c:\Projetos\General\video-novo\ferramenta-textos
python -m http.server 8080
```

Abra: http://localhost:8080

---

## Fluxo na ferramenta

1. Carregar base (`base-txt/…` ou upload).
2. **Gerar 5 narrativas** (Gemini ou templates locais).
3. Escolher uma narrativa.
4. **Omni** ou **Extend** → **Gerar arquivos .txt**.
5. **Copiar texto** → ChatGPT (keyframes) / Google Flow (roteiro).

Processo completo de vídeo: `../PROCESSO-VIDEOS-PH3A.md`

## Limitações

- **PDF** não é lido dentro da ferramenta — use os `.txt` de `base-txt/`.
- **Imagens** só no ChatGPT (`../mascot/`).
- Templates locais = rascunho; Gemini = narrativas mais variadas (precisa internet + localhost).
