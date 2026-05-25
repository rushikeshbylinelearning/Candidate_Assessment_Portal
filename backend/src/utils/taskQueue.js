/**
 * In-process concurrency limiter for CPU-heavy work (resume parsing, etc.).
 * Prevents shared-hosting process/thread exhaustion from parallel Gemini/PDF jobs.
 */

const MAX_CONCURRENT = Math.max(
  1,
  Math.min(3, parseInt(process.env.MAX_BACKGROUND_TASKS || '2', 10))
);

let active = 0;
const queue = [];

function runNext() {
  if (active >= MAX_CONCURRENT || queue.length === 0) return;
  const { fn, resolve, reject } = queue.shift();
  active += 1;
  Promise.resolve()
    .then(fn)
    .then(resolve, reject)
    .finally(() => {
      active -= 1;
      runNext();
    });
}

/**
 * Enqueue async work with a concurrency cap.
 * @param {() => Promise<void>} fn
 * @returns {Promise<void>}
 */
function enqueue(fn) {
  return new Promise((resolve, reject) => {
    queue.push({ fn, resolve, reject });
    runNext();
  });
}

function getQueueStats() {
  return { active, queued: queue.length, maxConcurrent: MAX_CONCURRENT };
}

module.exports = { enqueue, getQueueStats };
