#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
grep -qE 'path="artist/:|path="artist/' src/App.tsx && echo "PASS route" || { echo "FAIL route"; F=1; }
grep -rliE "discography|top tracks" src/pages/ | grep -q . && echo "PASS content" || { echo "FAIL content"; F=1; }
grep -rli "follow" src/pages/ | grep -q . && echo "PASS follow" || { echo "FAIL follow"; F=1; }
grep -rliE "support|tip" src/pages/ | grep -q . && echo "PASS support" || { echo "FAIL support"; F=1; }
grep -rq "/artist/" src/pages/ && echo "PASS wiring" || { echo "FAIL wiring"; F=1; }
exit $F
