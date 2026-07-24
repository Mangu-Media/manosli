#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
grep -q 'path="app"' src/App.tsx && echo "PASS route:/app" || { echo "FAIL route:/app"; F=1; }
A=$(ls public/audio 2>/dev/null | grep -cE '\.(mp3|ogg|m4a)$'); [ "$A" -ge 4 ] && echo "PASS audio($A)" || { echo "FAIL audio($A)"; F=1; }
grep -rqE "new Audio|<audio" src/ && echo "PASS audioelement" || { echo "FAIL audioelement"; F=1; }
grep -rq "timeupdate" src/ && echo "PASS timeupdate" || { echo "FAIL timeupdate"; F=1; }
grep -rqE '\\_INIT|\\\* ' src/ && { echo "FAIL escapes"; F=1; } || echo "PASS escapes"
grep -rliE "pulse|aurora|void" src/pages/player src/pages/App 2>/dev/null | grep -q . && echo "PASS tokens" || { grep -rqE "pulse-|aurora|bg-void|text-ghost" src/ && echo "PASS tokens" || { echo "FAIL tokens"; F=1; }; }
exit $F
