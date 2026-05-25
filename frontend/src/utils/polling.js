/**
 * Exponential-backoff polling — reduces idle API load vs fixed 3s intervals.
 */
export function createBackoffPoller({
  poll,
  isDone,
  onDone,
  onError,
  initialMs = 3000,
  maxMs = 15000,
  maxAttempts = 40,
}) {
  let attempt = 0;
  let delay = initialMs;
  let timer = null;
  let stopped = false;

  const stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const tick = async () => {
    if (stopped) return;
    attempt += 1;
    try {
      const result = await poll();
      if (isDone(result)) {
        stop();
        onDone?.(result);
        return;
      }
      if (attempt >= maxAttempts) {
        stop();
        onError?.(new Error('Polling timed out'));
        return;
      }
    } catch (err) {
      if (attempt >= maxAttempts) {
        stop();
        onError?.(err);
        return;
      }
    }
    delay = Math.min(maxMs, Math.round(delay * 1.4));
    timer = setTimeout(tick, delay);
  };

  timer = setTimeout(tick, initialMs);
  return { stop };
}
