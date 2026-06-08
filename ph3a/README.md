# PH3A Studio v2

Versão organizada da ferramenta de textos/keyframes PH3A, com layout exportado do **Google Stitch** e lógica compartilhada na pasta pai (`ferramenta-textos/`).

## Entrada

```bash
cd ferramenta-textos
python proxy-server.py
```

Abra: **http://localhost:8080/ph3a/**

## Estrutura

| Pasta / arquivo | Função |
|-----------------|--------|
| `index.html` | App funcional — abas Avatar, Keyframes, Vídeos |
| `js/studio-shell.js` | Navbar, tabs, modal API |
| `css/stitch-bridge.css` | Bridge widgets + tokens Stitch (#fb5b28) |
| `js/stitch-theme.js` | Config Tailwind exportada do Stitch |
| `layout/stitch/` | HTML de referência exportados do Stitch |
| `preview.html` | Links para os mockups Stitch |
| `.stitch-project.json` | IDs do projeto Stitch |

Scripts compartilhados (`app.js`, `keyframes-ui.js`, etc.) ficam em `../` e usam `window.PH3A_ASSET_BASE = "../"` para `base-txt/` e assets.

## Abas

1. **Avatar** — referências, paleta, gerar A/B, profile para prompts  
2. **Keyframes** — base produto, narrativas, export .txt, geração KF por API  
3. **Vídeos** — roteiros Flow (Omni / Extend), checklist, cópia dos `.txt`

## Re-exportar layout do Stitch

Defina a chave (não commitar):

```powershell
$env:STITCH_API_KEY = "sua-chave"
.\ph3a\scripts\fetch-stitch-layout.ps1
```

## Legado

- `../index.html` — versão clássica  
- `../index_v2.html` — v2 anterior (2 abas, na raiz)
