import { mkdirSync } from "node:fs";
import { pipeline, env } from "@huggingface/transformers";

mkdirSync("/workspace/data/models", { recursive: true });
env.cacheDir = "/workspace/data/models";
env.allowLocalModels = false;

const which = process.argv[2] || "clip";

if (which === "clip" || which === "all") {
  console.log("loading CLIP ViT-B/32 q8…");
  const classifier = await pipeline(
    "zero-shot-image-classification",
    "Xenova/clip-vit-base-patch32",
    { dtype: "q8", device: "cpu" },
  );
  const image = process.argv[3];
  if (image) {
    const labels = [
      "a photo of a pied kingfisher bird",
      "a photo of an african elephant",
      "a photo of a butterfly",
      "a photo of a palm tree",
      "a photo of a lizard",
      "a photo of a parrot",
    ];
    const output = await classifier(image, labels);
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log("clip ready");
  }
}

if (which === "gemma" || which === "all") {
  console.log("loading Gemma 3 270M q4f16…");
  const generator = await pipeline(
    "text-generation",
    "onnx-community/gemma-3-270m-it-ONNX",
    { dtype: "q4f16", device: "cpu" },
  );
  const output = await generator(
    [
      {
        role: "system",
        content:
          "You write two calm sentences for a nature field guide. Use only the facts given.",
      },
      {
        role: "user",
        content:
          "Species: Pied kingfisher (Ceryle rudis). Habitat: rivers and lagoons. Diet: fish. Behaviour: hovers and dives. Status: Least concern. Write the trail note.",
      },
    ],
    { max_new_tokens: 80, do_sample: false },
  );
  const generated = output[0]?.generated_text;
  const text = Array.isArray(generated)
    ? generated.at(-1)?.content
    : generated;
  console.log("GEMMA:", text);
}

console.log("done");
