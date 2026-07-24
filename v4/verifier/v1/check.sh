#!/bin/bash
# usage: check.sh <worktree> ; exit 0 = pass
W="$1"; F=0
cd "$W" || exit 1
npm run build >/tmp/build.log 2>&1 && echo "PASS build" || { echo "FAIL build"; F=1; }
R=$(grep -oE 'path="[^"]+"' src/App.tsx | sort -u | wc -l)
[ "$R" -ge 6 ] && echo "PASS routes($R)" || { echo "FAIL routes($R)"; F=1; }
for k in "federated" "on-device" "IPFS" "end-to-end" "spatial" "co-curation"; do
  grep -riq "$k" src/ && echo "PASS content:$k" || { echo "FAIL content:$k"; F=1; }
done
grep -riq "manosli" index.html src/components/Navbar.tsx src/components/Footer.tsx && echo "PASS brand" || { echo "FAIL brand"; F=1; }
for f in Navbar Footer Layout; do [ -f "src/components/$f.tsx" ] && echo "PASS comp:$f" || { echo "FAIL comp:$f"; F=1; }; done
A=$(ls public/ | grep -cE '\.(png|jpg|jpeg|mp4|webp)$')
[ "$A" -ge 3 ] && echo "PASS assets($A)" || { echo "FAIL assets($A)"; F=1; }
exit $F
