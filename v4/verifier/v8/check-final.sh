#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
grep -rliE "analytics|year in sound|listening stats" src/pages/player/ | grep -q . && echo "PASS analytics" || { echo "FAIL analytics"; F=1; }
grep -rqi "uploads" src/pages/PlayerApp.tsx && grep -rqiE "rank|score|relevance" src/pages/player/ && echo "PASS search" || { echo "FAIL search"; F=1; }
grep -rq "beforeinstallprompt" src/ && echo "PASS install" || { echo "FAIL install"; F=1; }
grep -rqE "setPositionState|seekbackward" src/pages/player/ && echo "PASS mediasession2" || { echo "FAIL mediasession2"; F=1; }
exit $F
