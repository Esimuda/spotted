/**
 * The published Gemma ONNX graph gathers token embeddings with int64 indices.
 * onnxruntime's WASM build only implements GatherBlockQuantized for int32, so
 * the session never starts. These files are that graph plus one Cast. The
 * weights still come from the Hugging Face repo.
 *
 * Transformers.js snapshots fetch when its module first evaluates, so this
 * has to run before that import.
 */
const PATCHED_GRAPH: Record<string, string> = {
  "model_q4.onnx": "/models/gemma/model_q4.onnx",
  "model_q4f16.onnx": "/models/gemma/model_q4f16.onnx",
};

export function configureOnnxWasm(env: { backends?: { onnx?: { wasm?: { wasmPaths?: unknown; numThreads?: number } } } }) {
  const wasm = env.backends?.onnx?.wasm;
  if (!wasm) return;
  wasm.wasmPaths = {
    mjs: "/ort/ort-wasm-simd-threaded.mjs",
    wasm: "/ort/ort-wasm-simd-threaded.wasm",
  };
  wasm.numThreads = 1;
}

export function installGemmaGraphPatch() {
  const host = globalThis as typeof globalThis & { __spottedGemmaFetch?: boolean };
  if (host.__spottedGemmaFetch || typeof globalThis.fetch !== "function") return;
  const original = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const file = url.split("?")[0]?.split("/").pop() ?? "";
    const patched = PATCHED_GRAPH[file];
    if (patched && url.includes("/onnx/")) {
      console.info(`[spotted-gemma] graph ${file}`);
      return original(patched);
    }
    return original(input, init);
  }) as typeof fetch;
  host.__spottedGemmaFetch = true;
}
