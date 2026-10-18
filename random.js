// Ideal H|0> measurement has P(0) = P(1) = 1/2.
// This simulator samples that distribution; it does not access quantum hardware.
export const outcomes = Array.from({length: 8}, (_, i) => i === 7 ? 'No Winner' : `Player ${i + 1}`);
export function draw(mode, rng = Math.random) {
  if (mode === 'classical') return Math.floor(rng() * 8);
  if (mode === 'quantum') return (rng() < .5 ? 0 : 4) + (rng() < .5 ? 0 : 2) + (rng() < .5 ? 0 : 1);
  throw new Error('Unknown mode');
}
export function frequencies(values) {
  const counts = Array(8).fill(0);
  for (const n of values) counts[n]++;
  return counts;
}
export function csv(rows) {
  return rows.map(row => row.map(value => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n');
}
