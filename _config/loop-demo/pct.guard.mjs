import { pct } from "./pct.mjs";
const cases = [[1,4,25],[1,3,33.33],[0,5,0],[5,0,0],[3,8,37.5]];
let fail = 0;
for (const [p,w,want] of cases)
  if (pct(p,w) !== want) { console.log(`FAIL pct(${p},${w}) → ${pct(p,w)}, want ${want}`); fail = 1; }
console.log(fail ? "GUARD: FAIL" : "GUARD: PASS");
process.exit(fail);
