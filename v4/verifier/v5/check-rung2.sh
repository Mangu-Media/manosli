#!/bin/bash
W="$1"; F=0; cd "$W" || exit 1
N=$(find api -name '*.ts' 2>/dev/null | wc -l); [ "$N" -ge 3 ] && echo "PASS api($N)" || { echo "FAIL api($N)"; F=1; }
grep -rqi "mongodb" api/ 2>/dev/null && grep -rqi "MONGODB_URI\|process.env" api/ && echo "PASS mongo" || { echo "FAIL mongo"; F=1; }
grep -rq "fetch(" src/pages/player/ && echo "PASS apirepo" || { echo "FAIL apirepo"; F=1; }
grep -rqi "sign in\|login" src/pages/player/ src/pages/PlayerApp.tsx && echo "PASS authui" || { echo "FAIL authui"; F=1; }
grep -rqi "google" src/pages/player/ && grep -rqi "apple" src/pages/player/ && echo "PASS oauth" || { echo "FAIL oauth"; F=1; }
[ -f vercel.json ] && grep -q "rewrite" vercel.json && echo "PASS vercel" || { echo "FAIL vercel"; F=1; }
exit $F
