// Retrieval evaluation: for each natural-language query, is the expected product in the top 3?
// Run after seeding:  npm run eval   (needs Mongo + Redis running)
// This is how you answer "how do you know your RAG works?" with a number instead of a vibe.
import redis from '../src/redis.js';
import { embed } from '../src/services/embeddings.js';
import { search } from '../src/services/vectorStore.js';

const CASES = [
  ['waterproof jacket for trekking in the rain', 'TrailShell Waterproof Jacket'],
  ['keep my water cold during a hike', 'FrostKeep Insulated Steel Bottle 1L'],
  ['headphones that block airplane noise', 'QuietCloud ANC Headphones'],
  ['something to charge my phone on a long trip', 'VoltMax 20000mAh Power Bank'],
  ['I want to start making good coffee at home', 'BrewMaster Pour-Over Coffee Set'],
  ['a chair that supports my back while working', 'Lumbar Pro Mesh Office Chair'],
  ['improve air quality, I have allergies', 'PureAir HEPA Air Purifier'],
  ['equipment for home workouts with weights', 'IronCore Adjustable Dumbbell Pair'],
  ['light for walking in the dark', 'Lumen Rechargeable Headlamp'],
  ['a speaker for a picnic', 'PocketBeat Bluetooth Speaker'],
];

let hit1 = 0, hit3 = 0;
for (const [query, expected] of CASES) {
  const hits = await search(await embed(query), { k: 3, type: 'product' });
  const rank = hits.findIndex((h) => h.title === expected);
  if (rank === 0) hit1++;
  if (rank >= 0) hit3++;
  console.log(`${rank >= 0 ? 'PASS' : 'FAIL'}  rank=${rank >= 0 ? rank + 1 : '-'}  "${query}"  ->  top: ${hits[0]?.title}`);
}
console.log(`\nhit@1 = ${hit1}/${CASES.length}   hit@3 = ${hit3}/${CASES.length}`);
redis.disconnect();
