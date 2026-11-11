#!/usr/bin/env python3
"""Mini-lecteur Markdown — 100% stdlib, économe.

Usage:
    python3 reader.py [--port 8000] [--dir /home/kurtdegla/Modèles]

Ouvre ensuite http://localhost:8000 dans Firefox.
- Rend le markdown (cache les ```, '' etc.)
- Gros texte réglable, thèmes clair/sépia/sombre/contraste
- Sidebar + recherche, sommaire auto. Rien à installer.
"""
import argparse
import html
import json
import os
import re
import tempfile
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE = Path(__file__).parent.resolve()

# ---------- Markdown minimal (stdlib only) ----------

def _inline(s: str) -> str:
    s = html.escape(s, quote=False)
    # images ![a](u)
    s = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img alt="\1" src="\2" loading="lazy">', s)
    # liens [t](u)
    s = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', s)
    # code inline `x`
    s = re.sub(r'`([^`]+?)`', r'<code>\1</code>', s)
    # gras **x** puis italique *x*
    s = re.sub(r'\*\*([^*]+?)\*\*', r'<strong>\1</strong>', s)
    s = re.sub(r'(?<!\*)\*([^*]+?)\*(?!\*)', r'<em>\1</em>', s)
    s = re.sub(r'~~([^~]+?)~~', r'<del>\1</del>', s)
    return s


def _slug(t: str, seen: dict) -> str:
    base = re.sub(r'[^a-z0-9]+', '-', t.lower()).strip('-') or 'section'
    n = seen.get(base, 0)
    seen[base] = n + 1
    return base if n == 0 else f"{base}-{n}"


def md_to_html(src: str):
    """Rend un sous-ensemble Markdown -> HTML + TOC [(level, id, text)]."""
    lines = src.splitlines()
    out, toc, seen = [], [], {}
    in_code, code_lang, code_buf = False, '', []
    para = []
    list_stack = []  # list of ('ul'|'ol', indent)
    table_buf = []

    def flush_para():
        if para:
            out.append(f"<p>{_inline(' '.join(para))}</p>")
            para.clear()

    def close_lists(to_indent=-1):
        while list_stack and list_stack[-1][1] > to_indent:
            tag, _ = list_stack.pop()
            out.append(f"</{tag}>")

    def flush_table():
        if not table_buf:
            return
        rows = [r.strip().strip('|').split('|') for r in table_buf]
        rows = [[c.strip() for c in r] for r in rows]
        if len(rows) >= 2 and all(re.fullmatch(r':?-+:?', c or '---') for c in rows[1]):
            head, body = rows[0], rows[2:]
        else:
            head, body = rows[0], rows[1:]
        h = ['<table><thead><tr>'] + [f"<th>{_inline(c)}</th>" for c in head] + ['</tr></thead><tbody>']
        for r in body:
            h.append('<tr>' + ''.join(f"<td>{_inline(c)}</td>" for c in r) + '</tr>')
        h.append('</tbody></table>')
        out.append(''.join(h))
        table_buf.clear()

    for line in lines:
        # bloc de code clôturé ```
        m = re.match(r'^\s*```\s*(\w*)\s*$', line)
        if m:
            if not in_code:
                flush_para(); flush_table(); close_lists()
                in_code, code_lang, code_buf = True, m.group(1), []
            else:
                code = html.escape('\n'.join(code_buf), quote=False)
                cls = f' class="lang-{html.escape(code_lang)}"' if code_lang else ''
                out.append(f"<pre><code{cls}>{code}</code></pre>")
                in_code = False
            continue
        if in_code:
            code_buf.append(line)
            continue
        if not line.strip():
            flush_para(); flush_table(); close_lists()
            continue
        # tableau ?
        if '|' in line and re.match(r'^\s*\|?.*\|.*$', line):
            # regarde si ligne suivante est séparateur ou si on est déjà dans un tableau
            flush_para()
            table_buf.append(line)
            continue
        else:
            flush_table()
        # titre
        m = re.match(r'^(#{1,6})\s+(.*)$', line)
        if m:
            flush_para(); close_lists()
            lvl, txt = len(m.group(1)), m.group(2).strip()
            hid = _slug(re.sub(r'<[^>]+>', '', txt), seen)
            toc.append((lvl, hid, txt))
            out.append(f"<h{lvl} id=\"{hid}\">{_inline(txt)}</h{lvl}>")
            continue
        # séparateur
        if re.match(r'^\s*(---|\*\*\*|___)\s*$', line):
            flush_para(); close_lists(); out.append('<hr>'); continue
        # citation
        m = re.match(r'^\s*>\s?(.*)$', line)
        if m:
            flush_para(); close_lists()
            out.append(f"<blockquote>{_inline(m.group(1))}</blockquote>")
            continue
        # liste
        m = re.match(r'^(\s*)([-*+]|\d+[.)])\s+(.*)$', line)
        if m:
            flush_para()
            indent = len(m.group(1).replace('\t', '    '))
            tag = 'ol' if re.match(r'\d+[.)]', m.group(2)) else 'ul'
            if not list_stack or indent > list_stack[-1][1]:
                out.append(f"<{tag}>"); list_stack.append((tag, indent))
            elif indent < list_stack[-1][1]:
                close_lists(indent)
                if not list_stack or list_stack[-1][0] != tag:
                    out.append(f"<{tag}>"); list_stack.append((tag, indent))
            elif list_stack[-1][0] != tag:
                t, i = list_stack.pop(); out.append(f"</{t}>")
                out.append(f"<{tag}>"); list_stack.append((tag, indent))
            out.append(f"<li>{_inline(m.group(3))}</li>")
            continue
        # cases à cocher - [ ] / - [x] déjà gérées comme listes, enrichies ici
        para.append(line.strip())
    if in_code:  # bloc non fermé
        out.append(f"<pre><code>{html.escape(chr(10).join(code_buf), quote=False)}</code></pre>")
    flush_para(); flush_table(); close_lists()
    return ''.join(out), toc


# ---------- Scan fichiers ----------

FM_RE = re.compile(r'^---\n(.*?)\n---\n?', re.S)


def _front(text: str):
    """Sépare le frontmatter YAML du corps ; extrait les tags."""
    m = FM_RE.match(text)
    tags = []
    if m:
        for t in re.findall(r'tags:\s*\[([^\]]*)\]|tags:\s*(\S[^\n]*)', m.group(1)):
            tags += [x for x in re.split(r'[,\s]+', (t[0] or t[1] or '').strip()) if x]
        text = text[m.end():]
    return text, tags


def _excerpt(body: str, limit: int = 160) -> str:
    """Premier paragraphe lisible (hors titres/tableaux/code) pour les tooltips."""
    skip = False
    for ln in body.splitlines():
        s = ln.strip()
        if s.startswith('```'):
            skip = not skip
            continue
        if skip or not s or s.startswith(('#', '|')):
            continue
        s = re.sub(r'[*_`>~\[\]]', '', s)
        return s[:limit] + ('…' if len(s) > limit else '')
    return ''


def _title(body: str, limit: int = 80) -> str:
    """Première ligne de titre (après frontmatter) comme nom de la note."""
    for l in body.splitlines():
        l = l.strip().lstrip('#').strip()
        if l:
            return l[:limit]
    return ''


def list_md(base: Path):
    files = sorted(base.rglob('*.md'))
    out = []
    for f in files:
        if 'reader' in f.name:
            continue
        try:
            text = f.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue
        body, tags = _front(text)
        title = _title(body) or f.stem
        out.append({'path': str(f.relative_to(base)), 'title': title,
                    'tags': tags, 'excerpt': _excerpt(body)})
    return out


WIKI_RE = re.compile(r'!?\[\[([^\]]+)\]\]')


def _wiki_key(ref: str) -> str:
    ref = ref.split('|')[0].split('#')[0].strip()
    if ref.lower().endswith('.md'):
        ref = ref[:-3]
    return ref.strip().lower()


def build_graph(base: Path):
    """Nœuds = notes, arêtes = [[wikilinks]] résolus (titre/stem/chemin)."""
    notes = sorted(f for f in base.rglob('*.md')
                   if 'reader' not in f.name and not f.name.endswith('.bak'))
    titles = {str(f.relative_to(base)): f.stem for f in notes}
    try:
        for f in notes:
            rel = str(f.relative_to(base))
            text = f.read_text(encoding='utf-8', errors='replace')
            body, _ = _front(text)
            titles[rel] = _title(body) or f.stem
    except OSError:
        pass
    keys = {}
    nodes = []
    for f in notes:
        rel = str(f.relative_to(base))
        stem = f.stem.lower()
        keys[stem] = rel
        keys[rel.lower()] = rel
        noext = rel[:-3].lower() if rel.lower().endswith('.md') else rel.lower()
        keys[noext] = rel
        keys[titles[rel].lower()] = rel
        nodes.append({'id': rel, 'title': titles[rel]})
    edges = []
    for f in notes:
        rel = str(f.relative_to(base))
        try:
            text = f.read_text(encoding='utf-8', errors='replace')
        except OSError:
            continue
        for m in WIKI_RE.finditer(text):
            if m.group(0).startswith('!'):
                continue
            dst = keys.get(_wiki_key(m.group(1)))
            if dst and dst != rel and not any(e['from'] == rel and e['to'] == dst for e in edges):
                edges.append({'from': rel, 'to': dst})
    return {'nodes': nodes, 'edges': edges}


# ---------- Page ----------

PAGE = r"""<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Modèles — Lecteur</title>
<script src="/cuisine/vendor/marked.min.js" defer></script>
<link rel="stylesheet" href="/cuisine/app.css?v=6"></head><body>
<header><b>📚 Modèles</b>
<button id="m" title="nav (sidebar)">☰</button>
<button id="bGraph">🕸️ Graphe</button><span id="savemsg"></span>
<button id="dm">A−</button><button id="pm">A+</button>
<select id="th"><option value="">Clair</option><option value="sepia">Sépia</option><option value="dark">Sombre</option><option value="contrast">Contraste fort</option></select>
<select id="lh"><option value="1.5">Compact</option><option value="1.7" selected>Aéré</option><option value="2">Très aéré</option></select>
</header>
<div id="lay"><aside id="sb"><input id="q" placeholder="🔍 filtrer… (ex: ufw)">
<div id="files">chargement…</div><div id="status"></div></aside>
<main><article><div class="atools" hidden><button id="aRead">📖 Lire</button><button id="aEdit">✏️ Éditer</button><button id="aSave" hidden>💾 Sauver</button></div><div id="meta"></div><div id="graphWrap" hidden><canvas id="cv"></canvas><div id="gHint"></div></div><div id="toc" hidden></div><textarea id="ed" hidden spellcheck="false"></textarea><div id="doc"><p>Choisis une note : ☰ sidebar · clic sur un nœud du graphe · 🔍 recherche.</p></div><div id="blinks" hidden></div></article></main>
<div id="tip" hidden></div>
<div id="modal" hidden><div class="mbox"><div class="mbar"><b id="mtitle"></b><span id="mtags"></span><button id="mRead" title="lire">📖</button><button id="mEdit" title="éditer">✏️</button><button id="mSave" hidden title="sauver (Ctrl+S)">💾</button><button id="mFull" title="pleine page">⛶</button><button id="mClose" title="fermer (Esc)">✕</button></div><div id="mmsg"></div><div id="mbody"></div><textarea id="med" hidden spellcheck="false"></textarea></div></div></div>
<script src="/cuisine/app.js?v=6" defer></script></body></html>"""


class H(BaseHTTPRequestHandler):
    server_version = 'Lecteur/1.0'

    def _send(self, body: bytes, ctype: str):
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        if u.path in ('/', '/index.html'):
            self._send(PAGE.encode(), 'text/html; charset=utf-8')
        elif u.path.startswith('/cuisine/'):
            rel = urllib.parse.unquote(u.path[len('/cuisine/'):])
            target = (BASE / 'cuisine' / rel).resolve()
            if not str(target).startswith(str(BASE / 'cuisine')) or not target.is_file():
                self.send_error(404)
                return
            data = target.read_bytes()
            ctype = 'application/octet-stream'
            if target.suffix == '.js':
                ctype = 'application/javascript; charset=utf-8'
            elif target.suffix == '.css':
                ctype = 'text/css; charset=utf-8'
            elif target.suffix in ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'):
                ctype = f'image/{target.suffix.lstrip(".")}'
            self._send(data, ctype)
        elif u.path == '/api/files':
            self._send(json.dumps(list_md(BASE), ensure_ascii=False).encode(),
                        'application/json; charset=utf-8')
        elif u.path == '/api/doc':
            q = urllib.parse.parse_qs(u.query)
            rel = q.get('path', [''])[0]
            target = (BASE / rel).resolve()
            if not str(target).startswith(str(BASE)) or not target.is_file() or target.suffix != '.md':
                self._send(json.dumps({'error': 'Fichier invalide'}).encode(),
                            'application/json')
                return
            text = target.read_text(encoding='utf-8', errors='replace')
            body, toc = md_to_html(text)
            self._send(json.dumps({'html': body, 'toc': toc}, ensure_ascii=False).encode(),
                        'application/json; charset=utf-8')
        elif u.path == '/api/raw':
            q = urllib.parse.parse_qs(u.query)
            rel = q.get('path', [''])[0]
            target = (BASE / rel).resolve()
            if not str(target).startswith(str(BASE)) or not target.is_file() or target.suffix != '.md':
                self._send(json.dumps({'error': 'Fichier invalide'}).encode(),
                            'application/json')
                return
            text = target.read_text(encoding='utf-8', errors='replace')
            self._send(json.dumps({'path': rel, 'markdown': text}, ensure_ascii=False).encode(),
                        'application/json; charset=utf-8')
        elif u.path == '/api/graph':
            self._send(json.dumps(build_graph(BASE), ensure_ascii=False).encode(),
                        'application/json; charset=utf-8')
        else:
            self.send_error(404)

    def do_POST(self):
        u = urllib.parse.urlparse(self.path)
        if u.path != '/api/save':
            self.send_error(404)
            return
        q = urllib.parse.parse_qs(u.query)
        rel = q.get('path', [''])[0]
        if not rel or not rel.endswith('.md') or '..' in rel.split('/'):
            self._send(json.dumps({'error': 'Chemin invalide (xxx.md sans ..)'}).encode(),
                        'application/json')
            return
        target = (BASE / rel).resolve()
        if not str(target).startswith(str(BASE)) or target.suffix != '.md':
            self._send(json.dumps({'error': 'Hors dossier'}).encode(),
                        'application/json')
            return
        try:
            n = int(self.headers.get('Content-Length', 0))
        except ValueError:
            n = 0
        if n <= 0 or n > 1_000_000:
            self._send(json.dumps({'error': 'Taille invalide (max 1 Mo)'}).encode(),
                        'application/json')
            return
        try:
            text = self.rfile.read(n).decode('utf-8')
        except UnicodeDecodeError:
            self._send(json.dumps({'error': 'UTF-8 requis'}).encode(),
                        'application/json')
            return
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.is_file():  # backup avant écrasement
                target.with_suffix(target.suffix + '.bak').write_bytes(target.read_bytes())
            fd, tmp = tempfile.mkstemp(dir=str(target.parent), prefix='.save-', suffix='.tmp')
            try:
                with os.fdopen(fd, 'w', encoding='utf-8') as fh:
                    fh.write(text)
                os.replace(tmp, target)
            finally:
                if os.path.exists(tmp):
                    os.unlink(tmp)
        except OSError as e:
            self._send(json.dumps({'error': f'Écriture impossible: {e}'}).encode(),
                        'application/json')
            return
        self._send(json.dumps({'ok': True, 'path': rel, 'bytes': len(text.encode())},
                               ensure_ascii=False).encode(),
                    'application/json; charset=utf-8')

    def log_message(self, *a):
        pass


def main():
    global BASE
    ap = argparse.ArgumentParser()
    ap.add_argument('--port', type=int, default=8000)
    ap.add_argument('--dir', default=str(BASE))
    a = ap.parse_args();
    BASE = Path(a.dir).resolve()
    srv = ThreadingHTTPServer(('127.0.0.1', a.port), H)
    print(f"📚 Lecteur : http://localhost:{a.port}  (dossier {BASE})")
    print("Ctrl+C pour arrêter.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    main()
