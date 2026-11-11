#!/usr/bin/env bash
# verif.sh — checks P1 (rendu) + P2 (édition) en 1 commande
# Usage: ./verif.sh [--port 8909]
set -u
PORT=8909
if [ "${1:-}" = "--port" ] && [ -n "${2:-}" ]; then PORT="$2"; fi
BASE="$(dirname "$0")"
OK=0; KO=0
pass(){ OK=$((OK+1)); echo "  ✅ $1"; }
fail(){ KO=$((KO+1)); echo "  ❌ $1"; }

echo "== [1/10] syntaxe reader.py =="
if python3 -c "import ast; ast.parse(open('$BASE/reader.py').read())" 2>&1; then pass "syntax OK"; else fail "syntax KO"; exit 1; fi

echo "== [2/10] démarrage serveur :$PORT =="
python3 "$BASE/reader.py" --port "$PORT" >/tmp/reader-verif.log 2>&1 &
SRV=$!
trap "kill $SRV 2>/dev/null" EXIT
sleep 1
if kill -0 $SRV 2>/dev/null; then pass "serveur vivant (pid $SRV)"; else fail "serveur mort — voir /tmp/reader-verif.log"; exit 1; fi

echo "== [3/10] /api/files (liste + excerpt tags) =="
if curl -s --max-time 5 "http://localhost:$PORT/api/files" | grep -q '"excerpt"'; then pass "liste + excerpt OK"; else fail "/api/files KO"; fi

echo "== [4/10] /api/raw =="
if curl -s --max-time 5 "http://localhost:$PORT/api/raw?path=CONCEPTS_PYTHON.md" | grep -q '"markdown"'; then pass "markdown brut OK"; else fail "/api/raw KO"; fi

echo "== [5/10] /cuisine/vendor/marked.min.js =="
INFO=$(curl -s -o /dev/null -w "%{http_code} %{content_type}" --max-time 8 "http://localhost:$PORT/cuisine/vendor/marked.min.js")
echo "  ($INFO)"
case "$INFO" in 200*javascript*) pass "marked servi OK";; *) fail "marked KO";; esac

echo "== [6/10] squelette P4 (modale + tooltip + split cuisine) =="
PAGE=$(curl -s --max-time 5 "http://localhost:$PORT/")
APPJS=$(curl -s --max-time 5 "http://localhost:$PORT/cuisine/app.js")
APPCSS=$(curl -s --max-time 5 "http://localhost:$PORT/cuisine/app.css")
{ echo "$PAGE" | grep -q "cuisine/app.css" && echo "$PAGE" | grep -q 'id="modal"' && echo "$PAGE" | grep -q 'id="tip"' && [ -n "$APPJS" ] && echo "$APPJS" | grep -q "openModal" && echo "$APPJS" | grep -q "showTip" && echo "$APPJS" | grep -q "setSb" && [ -n "$APPCSS" ] && echo "$APPCSS" | grep -q "#modal"; } && pass "P4 OK" || fail "P4 KO"

echo "== [7/10] POST /api/save + .bak =="
printf '# verif' | curl -s --max-time 5 -X POST --data-binary @- "http://localhost:$PORT/api/save?path=_verif-tmp.md" | grep -q '"ok"' && printf '# verif2' | curl -s --max-time 5 -X POST --data-binary @- "http://localhost:$PORT/api/save?path=_verif-tmp.md" | grep -q '"ok"' && [ -f "$BASE/_verif-tmp.md.bak" ] && pass "save + .bak OK" || fail "save KO"
rm -f "$BASE/_verif-tmp.md" "$BASE/_verif-tmp.md.bak"

echo "== [8/10] garde-fous (../ et non-.md refusés) =="
A=$(curl -s --max-time 5 -X POST --data-binary 'x' "http://localhost:$PORT/api/save?path=../evil.md")
B=$(curl -s --max-time 5 -X POST --data-binary 'x' "http://localhost:$PORT/api/save?path=x.txt")
{ echo "$A" | grep -q error && echo "$B" | grep -q error; } && pass "garde-fous OK" || fail "garde-fous KO"

echo "== [9/10] /api/graph (noeuds + arêtes) =="
G=$(curl -s --max-time 5 "http://localhost:$PORT/api/graph")
{ echo "$G" | grep -q '"nodes"' && echo "$G" | grep -q '"edges"'; } && pass "graphe OK" || fail "graphe KO"

echo "== [10/10] wikilink résolu en arête =="
printf 'Voir [[CONCEPTS_PYTHON]] et [[nope]].\n' | curl -s --max-time 5 -X POST --data-binary @- "http://localhost:$PORT/api/save?path=_verif-wiki.md" | grep -q '"ok"'
E=$(curl -s --max-time 5 "http://localhost:$PORT/api/graph")
echo "$E" | grep -q '"from": "_verif-wiki.md", "to": "CONCEPTS_PYTHON.md"' && pass "wikilink OK" || fail "wikilink KO"
rm -f "$BASE/_verif-wiki.md" "$BASE/_verif-wiki.md.bak"

kill $SRV 2>/dev/null; trap - EXIT
echo "----"
echo "Résultat : $OK OK / $KO KO"
[ "$KO" -eq 0 ]
