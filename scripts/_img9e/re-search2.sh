#!/bin/bash
cd "$(dirname "$0")" || exit 1
run() { # slug query outfile
  [ -s "$3" ] && { echo "SKIP $1"; return; }
  for attempt in 1 2 3; do
    timeout 170 z-ai image-search -q "$2" --count 5 --gl fr -o "$3" > "${1}-3.log" 2>&1
    if [ -s "$3" ] && grep -q '"success": true' "$3"; then echo "OK $1"; return; fi
    echo "RETRY $1 ($attempt)"; sleep $((attempt*15))
  done
  echo "FAIL $1"
}
run economie-attention "des gens assis côte à côte chacun absorbé dans son téléphone portable" economie-attention-3.json
sleep 12
run pourquoi-mentons-nous "une personne murmurant à l'oreille d'une autre personne dans la rue" pourquoi-mentons-nous-3.json
echo "DONE"
