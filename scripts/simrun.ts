import { runMany } from '../tests/simulate'
import { PRESETS } from '@/engine/balance'
console.log('   n   village%  stalled  outcomes')
for (const n of Object.keys(PRESETS).map(Number).sort((a,b)=>a-b)) {
  const r = runMany(PRESETS[n], 300, `p${n}`)
  const pct = (r.villageWinRate * 100).toFixed(1).padStart(6)
  const flag = r.villageWinRate < 0.40 || r.villageWinRate > 0.60 ? '  <-- outside 40-60' : ''
  console.log(`  ${String(n).padStart(2)} ${pct}%  ${String(r.stalled).padStart(5)}   ${JSON.stringify(r.tally)}${flag}`)
}
