#!/usr/bin/env python3
"""
Serve a ferramenta-textos e faz proxy da API OpenAI (evita CORS no navegador).

Uso (nesta pasta):
  python proxy-server.py

Abra: http://localhost:8080
"""
from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(os.environ.get("PORT", "8080"))
OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations"
OPENAI_IMAGES_EDITS_URL = "https://api.openai.com/v1/images/edits"


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()

    def do_POST(self) -> None:
        path = self.path.rstrip("/")
        if path == "/api/openai/chat":
            self._proxy_json(OPENAI_CHAT_URL)
            return
        if path == "/api/openai/images/generations":
            self._proxy_json(OPENAI_IMAGES_URL)
            return
        if path == "/api/openai/images/edits":
            self._proxy_images_edits()
            return
        if path == "/api/openai/fetch-image":
            self._fetch_image_url()
            return
        self.send_error(404)

    def _fetch_image_url(self) -> None:
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self._json_response(401, {"error": {"message": "Authorization Bearer obrigatório"}})
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json_response(400, {"error": {"message": "JSON inválido"}})
            return
        url = (payload.get("url") or "").strip()
        if not url.startswith("https://"):
            self._json_response(400, {"error": {"message": "url https obrigatória"}})
            return
        try:
            req = urllib.request.Request(url, method="GET")
            with urllib.request.urlopen(req, timeout=90) as resp:
                img = resp.read()
                content_type = resp.headers.get("Content-Type", "image/png")
                b64 = base64.b64encode(img).decode("ascii")
                self._json_response(
                    200,
                    {
                        "data_url": f"data:{content_type.split(';')[0]};base64,{b64}",
                        "b64": b64,
                    },
                )
        except Exception as e:
            self._json_response(502, {"error": {"message": str(e)}})

    def _proxy_images_edits(self) -> None:
        """JSON { model, prompt, size?, quality?, images: [{filename, content_type, b64}] } → multipart OpenAI."""
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self._json_response(401, {"error": {"message": "Authorization Bearer obrigatório"}})
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._json_response(400, {"error": {"message": "JSON inválido"}})
            return
        images = payload.get("images") or []
        if not images:
            self._json_response(400, {"error": {"message": "images[] obrigatório para edits"}})
            return
        try:
            body, content_type = self._build_multipart_edits(payload, images)
        except Exception as e:
            self._json_response(400, {"error": {"message": str(e)}})
            return
        req = urllib.request.Request(
            OPENAI_IMAGES_EDITS_URL,
            data=body,
            method="POST",
            headers={"Content-Type": content_type, "Authorization": auth},
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            self._json_response(502, {"error": {"message": str(e)}})

    @staticmethod
    def _build_multipart_edits(payload: dict, images: list) -> tuple[bytes, str]:
        import uuid

        boundary = f"----ph3a{uuid.uuid4().hex}"
        parts: list[bytes] = []

        def add_field(name: str, value: str) -> None:
            parts.append(
                f"--{boundary}\r\n".encode()
                + f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
                + value.encode("utf-8")
                + b"\r\n"
            )

        for key in ("model", "prompt", "size", "quality", "n"):
            val = payload.get(key)
            if val is not None and str(val) != "":
                add_field(key, str(val))

        for img in images:
            b64 = img.get("b64") or ""
            filename = img.get("filename") or "ref.png"
            ctype = img.get("content_type") or "image/png"
            try:
                binary = base64.b64decode(b64)
            except Exception as exc:
                raise ValueError(f"base64 inválido em {filename}") from exc
            parts.append(
                f"--{boundary}\r\n".encode()
                + f'Content-Disposition: form-data; name="image[]"; filename="{filename}"\r\n'.encode()
                + f"Content-Type: {ctype}\r\n\r\n".encode()
                + binary
                + b"\r\n"
            )

        parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(parts)
        return body, f"multipart/form-data; boundary={boundary}"

    def _proxy_json(self, target_url: str) -> None:
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            self._json_response(401, {"error": {"message": "Authorization Bearer obrigatório"}})
            return
        length = int(self.headers.get("Content-Length", "0"))
        body = self.rfile.read(length) if length else b"{}"
        req = urllib.request.Request(
            target_url,
            data=body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Authorization": auth,
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            err_body = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            self._json_response(502, {"error": {"message": str(e)}})

    def _json_response(self, code: int, payload: dict) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt: str, *args) -> None:
        if args and args[0].startswith("POST /api/openai"):
            return
        super().log_message(fmt, *args)


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = ThreadingHTTPServer(("", PORT), Handler)
    print(f"PH3A ferramenta-textos + proxy OpenAI (chat + generations + edits) → http://localhost:{PORT}")
    print("Ctrl+C para parar")
    server.serve_forever()
