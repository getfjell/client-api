// Polyfill fetch, FormData, Blob, and File for Node.js
import { fetch, FormData } from 'undici';
import { Blob, File } from 'node:buffer';
import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';

if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = fetch;
}
if (!globalThis.FormData) {
  // @ts-ignore
  globalThis.FormData = FormData;
}
if (!globalThis.Blob) {
  // @ts-ignore
  globalThis.Blob = Blob;
}
if (!globalThis.File) {
  // @ts-ignore
  globalThis.File = File;
}

const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();
