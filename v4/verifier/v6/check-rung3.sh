#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
A=$(ls public/audio/*.mp3 2>/dev/null | wc -l); [ "$A" -ge 20 ] && echo "PASS audio($A)" || { echo "FAIL audio($A)"; F=1; }
T=$(grep -c 'audioUrl' src/pages/player/data.ts 2>/dev/null); [ "$T" -ge 48 ] && echo "PASS tracks($T)" || { echo "FAIL tracks($T)"; F=1; }
ls public/audio/ledger.json src/pages/player/licenses.ts 2>/dev/null | grep -q . && grep -rqi "license" public/audio/ledger.json src/pages/player/licenses.ts 2>/dev/null && echo "PASS ledger" || { echo "FAIL ledger"; F=1; }
grep -rqi "upload" src/pages/player/ && echo "PASS upload" || { echo "FAIL upload"; F=1; }
grep -rq "library/history" src/pages/player/ && echo "PASS history" || { echo "FAIL history"; F=1; }
exit $F
