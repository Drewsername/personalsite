// A tiny JSON-file store for the small amounts of mutable state this site keeps.
//
// Two properties matter here and nothing else does:
//   * writes are atomic — temp file + rename, so a crash mid-write can never
//     leave a half-written listings file behind;
//   * read-modify-write is serialized per file, so two requests landing in the
//     same tick can't clobber each other. The server is a single process, so a
//     promise chain per path is a sufficient lock.
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const queues = new Map();

export async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return fallback;
    // A corrupt file is worse than a missing one: refuse to silently reset it.
    if (err instanceof SyntaxError) throw new Error(`${file} is not valid JSON`);
    throw err;
  }
}

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2));
  await rename(tmp, file);
}

// Read the file, hand it to `fn`, write back whatever `fn` returns. Calls
// against the same path run one at a time, in arrival order.
export function updateJson(file, fallback, fn) {
  const prev = queues.get(file) || Promise.resolve();
  const next = prev.then(async () => {
    const current = await readJson(file, fallback);
    const updated = await fn(current);
    if (updated !== undefined) await writeJson(file, updated);
    return updated;
  });
  // Keep the chain alive even when a caller's turn rejects.
  queues.set(
    file,
    next.catch(() => {})
  );
  return next;
}
