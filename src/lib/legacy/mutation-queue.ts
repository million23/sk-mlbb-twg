/**
 * Queues mutation calls and processes them with a minimum delay between each.
 * Prevents burst of rapid API calls (e.g. adding 6 team members at once).
 */
const DEFAULT_INTERVAL_MS = 400;

type QueuedItem<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
};

export function createMutationQueue<T = void>(intervalMs = DEFAULT_INTERVAL_MS) {
  const queue: QueuedItem<T>[] = [];
  let processing = false;
  let lastRun = 0;

  async function processNext() {
    if (queue.length === 0) {
      processing = false;
      return;
    }
    const now = Date.now();
    const elapsed = now - lastRun;
    const wait = Math.max(0, intervalMs - elapsed);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    const item = queue.shift();
    if (!item) {
      processNext();
      return;
    }
    lastRun = Date.now();
    try {
      const result = await item.execute();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
    processNext();
  }

  function enqueue(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push({ execute, resolve, reject });
      if (!processing) {
        processing = true;
        processNext();
      }
    });
  }

  return { enqueue };
}
