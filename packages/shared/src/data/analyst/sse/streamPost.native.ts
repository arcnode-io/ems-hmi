/**
 * Native streaming-POST transport — React Native's `fetch` buffers the whole
 * body, so we read incremental `responseText` from `XMLHttpRequest` progress
 * events instead. Each progress tick yields the delta since the last.
 */

import type { StreamPostInit } from "./streamPost.types";

export function streamPost(
  url: string,
  init: StreamPostInit,
  onChunk: (text: string) => void,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [key, value] of Object.entries(init.headers)) {
      xhr.setRequestHeader(key, value);
    }
    let sent = 0;
    const flush = (): void => {
      const text = xhr.responseText;
      if (text.length > sent) {
        onChunk(text.slice(sent));
        sent = text.length;
      }
    };
    xhr.onprogress = flush;
    xhr.onload = (): void => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`analyst stream — HTTP ${xhr.status}`));
        return;
      }
      flush();
      resolve();
    };
    xhr.onerror = (): void => reject(new Error("analyst stream — network error"));
    xhr.send(init.body);
  });
}
