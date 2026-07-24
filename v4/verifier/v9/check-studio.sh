#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
grep -q 'path="studio"' src/App.tsx && echo "PASS route" || { echo "FAIL route"; F=1; }
grep -rliE "studio" src/pages/ | grep -q . && echo "PASS studio-files" || { echo "FAIL studio-files"; F=1; }
grep -rliE "royalt" src/pages/ | grep -q . && echo "PASS royalty" || { echo "FAIL royalty"; F=1; }
grep -rq "ledger.json" src/ && echo "PASS ledger-link" || { echo "FAIL ledger-link"; F=1; }
grep -rliE "listeners|playEvents" src/pages/player/studio* src/pages/studio* 2>/dev/null | grep -q . && echo "PASS analytics" || { echo "FAIL analytics"; F=1; }
exit $F
