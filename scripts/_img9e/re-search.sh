#!/bin/bash
# Recherches complémentaires — séquentiel + pause (anti-429), sortie <slug>-2.json
cd "$(dirname "$0")" || exit 1
declare -A JOBS=(
  [economie-attention]="une personne plongée dans son smartphone dans le noir, le visage éclairé par l'écran"
  [sommeil-profond-cerveau]="adulte endormi paisiblement dans son lit, lumière douce du matin"
  [mythes-grecs-heritage]="statue antique en marbre d'un dieu grec exposée dans un musée"
  [pourquoi-mentons-nous]="portrait en clair-obscur d'un homme dont la moitié du visage est plongée dans l'ombre"
  [oceans-eponges-climat]="vue aérienne de l'océan bleu profond avec des vagues et de l'écume"
  [histoire-internet-arpanet-web]="grande salle d'ordinateurs centraux vintage avec bandes magnétiques, années 1970"
)
for slug in economie-attention sommeil-profond-cerveau mythes-grecs-heritage pourquoi-mentons-nous oceans-eponges-climat histoire-internet-arpanet-web; do
  [ -s "${slug}-2.json" ] && { echo "SKIP $slug"; continue; }
  for attempt in 1 2 3; do
    timeout 170 z-ai image-search -q "${JOBS[$slug]}" --count 5 --gl fr -o "${slug}-2.json" > "${slug}-2.log" 2>&1
    if [ -s "${slug}-2.json" ] && grep -q '"success": true' "${slug}-2.json"; then echo "OK $slug"; break; fi
    echo "RETRY $slug ($attempt)"; sleep $((attempt*15))
  done
  sleep 12
done
echo "RE-SEARCH DONE"
