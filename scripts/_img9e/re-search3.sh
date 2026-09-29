#!/bin/bash
cd "$(dirname "$0")" || exit 1
run() {
  [ -s "$3" ] && { echo "SKIP $1"; return; }
  for attempt in 1 2 3; do
    timeout 170 z-ai image-search -q "$2" --count 5 --gl fr -o "$3" > "${1}-4.log" 2>&1
    if [ -s "$3" ] && grep -q '"success": true' "$3"; then echo "OK $1"; return; fi
    echo "RETRY $1 ($attempt)"; sleep $((attempt*15))
  done
  echo "FAIL $1"
}
run economie-attention "jeune femme allongée dans le noir le visage éclairé par la lumière de son téléphone" economie-attention-4.json
sleep 12
run pourquoi-mentons-nous "cartes à jouer et jetons de poker sur une table verte" pourquoi-mentons-nous-4.json
sleep 12
run oceans-eponges-climat "grandes vagues de l'océan avec écume blanche se brisant sur la côte" oceans-eponges-climat-3.json
echo "DONE"
