/**
 * Open models that make identification and trail notes work.
 * BioCLIP (MIT) is the species-specialist swap-in, but its weights ship as
 * OpenCLIP checkpoints, not as Transformers.js ONNX. CLIP ViT-B/32 is the
 * model that actually runs in the browser today. Same task, same code path.
 */
export const VISION_MODEL = {
  id: "Xenova/clip-vit-base-patch32",
  name: "CLIP ViT-B/32",
  dtype: "q8" as const,
  license: "MIT",
  licenseUrl: "https://github.com/openai/CLIP/blob/main/LICENSE",
  task: "zero-shot image classification against the bundled field guide",
};

export const FACTS_MODEL = {
  id: "onnx-community/gemma-3-270m-it-ONNX",
  name: "Gemma 3 270M Instruct",
  dtype: "q4f16" as const,
  license: "Gemma Terms of Use",
  licenseUrl: "https://ai.google.dev/gemma/terms",
  task: "rewrite bundled field-guide facts into a short trail note",
};

export const BIOCLIP_SWAP = {
  id: "imageomics/bioclip",
  name: "BioCLIP",
  license: "MIT",
  licenseUrl: "https://huggingface.co/imageomics/bioclip",
  note: "Trained on the tree of life. Drop an ONNX export onto the same zero-shot path when you want finer species calls. Not bundled, because no Transformers.js build is published.",
};
