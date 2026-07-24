#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
grep -rqiE "Repository" src/pages/player && echo "PASS seam" || { echo "FAIL seam"; F=1; }
grep -rq "localStorage" src/pages/player && echo "PASS localStorage" || { echo "FAIL localStorage"; F=1; }
M=$(ls public/manifest.webmanifest public/manifest.json 2>/dev/null | head -1)
[ -n "$M" ] && grep -qi "manosli" "$M" && echo "PASS manifest" || { echo "FAIL manifest"; F=1; }
grep -q "manifest" index.html && echo "PASS manifest-link" || { echo "FAIL manifest-link"; F=1; }
ls public/sw.js >/dev/null 2>&1 && grep -rq "serviceWorker" src/ && echo "PASS sw" || { echo "FAIL sw"; F=1; }
grep -rq "mediaSession" src/pages/player && echo "PASS mediasession" || { echo "FAIL mediasession"; F=1; }
exit $F
