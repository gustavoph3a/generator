# Brief para Stitch — PH3A Studio (desktop)

Copie o bloco **「PROMPT STITCH」** abaixo e cole no Stitch. Ajuste se quiser; este texto descreve o produto real que estamos construindo.

---

## PROMPT STITCH

Design a **desktop-only** web app UI (1440px wide, not mobile) called **「PH3A Studio」** — an internal tool for marketing video production at PH3A (Brazilian B2B data company). Dark theme, professional but friendly. **Portuguese (pt-BR) labels** on all UI text.

### Brand theme (strict)

- **Background:** charcoal `#1A1A1A`
- **Cards / surfaces:** dark gray `#242424`, border `#333333`
- **Primary accent:** orange PH3A `#E94E1B` (buttons, active tab, highlights, glow hints)
- **Text primary:** cream `#F5F1EA`
- **Text secondary / hints:** muted gray `#9A9A9A`
- **Typography:** clean sans-serif (Segoe UI / Inter style), rounded bold for headings
- **Style language:** 2D flat tech-cute (same family as their mascot videos) — **not** glassmorphism, **not** light mode
- **Corner radius:** 8px cards, pill-shaped tab buttons
- **Optional decorative:** soft organic orange blobs in empty states (brand motif)

### Global layout (always visible top bar)

Sticky **top navigation bar** (~56px height), full width:

**Left:** Logo text 「PH3A Studio」 (cream, bold)

**Center:** **3 main tabs** (pill buttons, horizontal):
1. **Avatar**
2. **Keyframes**
3. **Vídeos**

Only **one tab content area** visible at a time — switching tabs completely replaces the main workspace (no stacked sections).

**Right cluster:**
- Small **avatar status badge** (e.g. 「Avatar Cubo PH3A」 or 「Avatar personalizado · DINO-PH」) with optional 28px thumbnail when custom
- Toggle: **「Cubo PH3A」** | **「Personalizado」** (segmented control; Personalizado disabled until user creates avatar)
- **Gear icon button** ⚙ opens settings modal (API keys)

### Settings modal (gear)

Centered modal overlay, max-width ~520px:
- Title: 「Configurações · API narrativas」
- Radio options:
  - Templates locais (offline)
  - **ChatGPT / OpenAI** (default selected)
  - Gemini
- Collapsible sections for API key inputs (password fields), Save / Test buttons
- Close X

---

## TAB 1 — Avatar

**Purpose:** Define the video mascot **before** creating scenes. User uploads reference images; AI analyzes and generates **2 variant sheets (A and B)**; user picks one. This avatar is reused in Keyframes and Vídeos tabs.

**Layout:** Single column, max content width ~920px centered. Cards stacked vertically.

**Card 1 — Referências**
- Large dashed **drop zone**: 「Arraste, escolha arquivos ou Ctrl+V」
- Thumbnail strip of uploaded refs (max 6), removable
- Buttons: 「Escolher arquivos」, 「Limpar refs」
- Hint: nothing is sent to API until user clicks Generate

**Card 2 — Paleta e estilo**
- **Palette:** radio 「Paleta PH3A」 (Charcoal / Laranja #E94E1B / Cream #F5F1EA) | 「Customizada」 (3 color pickers + notes)
- **Render:** radio 「2D flat PH3A」 | 「3D estilizado」
- Primary CTA: orange button **「Gerar avatar (A / B)」**
- Status line below (loading steps: analyzing → generating A → generating B)

**Card 3 — Variantes A / B**
- Two equal columns side by side
- Each: title 「Variante A」 / 「Variante B」, square preview area (1:1), buttons 「Usar esta」, 「Baixar PNG」
- Selected variant: orange border ring

**Card 4 — Profile output**
- Readonly monospace textarea: generated **avatar profile text** (how it will be injected into future prompts)
- Buttons: 「Copiar profile」, 「Ir para Keyframes →」

---

## TAB 2 — Keyframes

**Purpose:** Product knowledge → pick narrative → export prompt `.txt` files → optionally **generate 4 static 16:9 PNG keyframes** via OpenAI API. All prompts use the **avatar selected in top bar** (Cubo or custom).

**Layout:** Wider max-width ~1100px. Vertical step cards numbered 1–5.

**Banner (top of tab):** prominent strip showing active avatar:  
「Avatar Cubo PH3A — CUBO-PH」 or 「Avatar personalizado definido — {name} · Variante A」

**Step 1 — Base do produto**
- Dropdown: load preset from product list (DataFraud, DataBusca, DataTag, etc.)
- File upload .txt + paste textarea
- Fields: Product name, Tagline, Profile dropdown
- Button: 「Gerar 5 narrativas」

**Step 2 — Narrativa**
- List of 5 selectable narrative cards (radio/list); each shows label + short preview
- Hint: click again to regenerate 5 new options

**Step 3 — Roteiro Flow** (metadata only here; full scripts live in Tab Vídeos)
- Radio: Omni ~10s | Extend 8s+8s
- Button: 「Gerar arquivos .txt」

**Step 4 — Texto gerado**
- Tab bar for files: `prompts-chatgpt-keyframes.txt`, `roteiro-flow.txt`, `roteiro-flow-v2.txt`, splits
- Large readonly preview textarea
- Copy / Download buttons

**Step 5 — Keyframes por API** (optional)
- Mascot reference drop zone (auto-filled from chosen avatar PNG)
- Buttons: KF 1, KF 2, KF 3, KF 4, pairs 1–2 and 3–4
- **4 preview slots** 16:9 with states: idle, loading spinner, image, error
- Download per slot + Download all

---

## TAB 3 — Vídeos

**Purpose:** Turn approved keyframe PNGs into **Google Flow** video prompts (Omni single clip or Extend two-part). User already has keyframes from Tab 2; here they focus on **motion scripts** and Flow instructions.

**Layout:** Similar to Keyframes tab width.

**Banner:** Same avatar status + note: 「Use os PNGs keyframe_1…4 da pasta do produto」

**Section A — Modo de vídeo**
- Cards: **Omni (~10s, 1 clipe)** vs **Extend (8s + 8s)**
- Product folder hint

**Section B — Roteiro selecionado**
- Show active file from Step 4 (roteiro-flow.txt or split-1/split-2)
- Editable or readonly preview (design as readonly + copy)
- Checklist for Flow: attach PNGs, duration, extend button

**Section C — Instruções Flow (checklist UI)**
- Vertente A steps: attach 4 PNGs → paste prompt → 10s
- Vertente B steps: clip 1 (KF1+2) → Extend → clip 2 (KF3+4)

**Section D — Negative prompt / movimento** (collapsed advanced)
- Short hints consistent with PH3A rules (no lightning, pt-BR only, same mascot)

*Note for designer: Tab Vídeos is mostly **documentation + copy workflow**; generation happens in Google Flow external tool, not in this app.*

---

## User flow (for flow diagram in Stitch)

```
[Avatar tab] Upload refs → Generate A/B → Pick variant → (optional) copy profile
       ↓ avatar saved globally in top bar
[Keyframes tab] Load product base → Pick narrative → Export .txt → Generate KF PNGs (API)
       ↓ keyframe_1…4.png
[Vídeos tab] Choose Omni or Extend → Copy roteiro-flow → Use in Google Flow with PNGs
```

---

## Interaction rules

- Tabs **hide** inactive content completely (no scroll-through of other tabs)
- Orange = primary action and active tab
- Secondary buttons: dark gray outline
- Loading: orange spinner on image slots
- Errors: soft red text `#F0A090`
- Desktop only; no bottom nav; no hamburger

### Deliverables from Stitch

1. **Full page mockup** — Keyframes tab active, avatar badge visible in top bar
2. **Full page mockup** — Avatar tab with A/B variants filled
3. **Full page mockup** — Vídeos tab with Omni checklist
4. **Settings modal** state
5. **Component notes:** tab bar, avatar badge, KF 16:9 slot, narrative card, drop zone

---

## Context (for designer, optional)

- Mascot default: **CUBO-PH** — charcoal cube robot, orange edges, kawaii eyes on screen, cream cloud
- Custom avatar: user-defined character (e.g. dinosaur) remapped to PH3A palette
- Products: DataFraud, DataBusca, DataTag, DataDossiê, DataCob, DataRC6
- Output aspect ratio for keyframes: **16:9 (1920×1080)**

---

*Arquivo gerado para o projeto video-novo/ferramenta-textos · PH3A Studio v2*
