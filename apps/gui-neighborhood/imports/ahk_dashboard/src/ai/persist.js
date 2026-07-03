// src/ai/persist.js
export async function saveRoadmapTask(task) {
  const res = await fetch('/api/save-roadmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task })
  });
  if (!res.ok) throw new Error('Save failed');
  return await res.json(); // { ok: true, count }
}
