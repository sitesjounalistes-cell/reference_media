#!/bin/bash
# Reprise : MAXPAR=3 + stagger 10s + 3 tentatives (évite les 429 de la 1re passe)
cd "$(dirname "$0")" || exit 1
MAXPAR=3
running=0
while IFS='|' read -r slug query; do
  [ -z "$slug" ] && continue
  if [ -s "${slug}.json" ]; then echo "SKIP $slug (existe)"; continue; fi
  (
    for attempt in 1 2 3; do
      timeout 170 z-ai image-search -q "$query" --count 5 --gl fr -o "${slug}.json" > "${slug}.log" 2>&1
      if [ -s "${slug}.json" ] && grep -q '"success": true' "${slug}.json"; then echo "OK $slug (essai $attempt)"; break; fi
      echo "RETRY $slug essai $attempt"
      sleep $((attempt*20))
    done
  ) &
  running=$((running+1))
  sleep 10
  if [ "$running" -ge "$MAXPAR" ]; then wait -n; running=$((running-1)); fi
done < queries.tsv
wait
echo "ALL DONE"
