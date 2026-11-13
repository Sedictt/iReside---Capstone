import { AsyncLocalStorage } from "node:async_hooks";
import type { EmailOptions } from "./transport";

export const emailPreviewStorage = new AsyncLocalStorage<{
  captured?: EmailOptions;
}>();

export async function captureEmailPreview(
  fn: () => Promise<unknown>,
): Promise<EmailOptions | null> {
  const store: { captured?: EmailOptions } = {};
  await emailPreviewStorage.run(store, fn);
  return store.captured ?? null;
}
