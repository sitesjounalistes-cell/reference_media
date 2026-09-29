#!/bin/bash
# Lance les recherches image-search en parallèle (resumable : saute les .json existants)
cd "$(dirname "$0")" || exit 1
MAXPAR=6
running=0
while IFS='|' read -r slug query; do
  [ -z "$slug" ] && continue
  if [ -s "${slug}.json" ]; then echo "SKIP $slug (existe)"; continue; fi
  (
    timeout 170 z-ai image-search -q "$query" --count 5 --gl fr -o "${slug}.json" > "${slug}.log" 2>&1
    ec=$?
    if [ $ec -ne 0 ]; then
      echo "FAIL $slug (exit $ec)"
    elif ! grep -q '"success": true' "${slug}.json" 2>/dev/null; then
      echo "EMPTY $slug"
    else
      echo "OK $slug"
    fi
  ) &
  running=$((running+1))
  if [ "$running" -ge "$MAXPAR" ]; then wait -n; running=$((running-1)); fi
done < queries.tsv
wait
echo "ALL DONE"
