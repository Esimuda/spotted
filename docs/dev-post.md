---
title: Look up. The name was the short part.
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

[YOUR INTRO]

Write two or three sentences in your own voice here. Who you are, and why a phone that tells you to look up was the thing you wanted to build. Delete this note before you publish.

I live in Nigeria. The demo trail uses places I want the guide to be useful: Lekki Conservation Centre, Okomu, Obudu, and Yankari. The field guide itself is wider than those parks. It covers birds, reptiles, insects, mammals, and trees you actually meet in Lagos, Benin City, and Ibadan gardens, parks, and compounds, and it keeps a few species from elsewhere so the app is not lost on another continent.

The name is Spotted. It lives in one constant, `APP_NAME` in `src/config/brand.ts`.

## The walk

[YOUR OUTSIDE STORY]

Write this after a real walk. Where you went, what you did with the phone, and whether you actually looked up. Do not invent this. Delete this note before you publish.

[YOUR PHOTO RESULTS]

| Photo | What I thought it was | What Spotted said | Sure or not sure | What I noticed in the minute |
| --- | --- | --- | --- | --- |
| [photo 1] | [your guess] | [app result] | [sure / not sure] | [what you wrote] |
| [photo 2] |  |  |  |  |
| [photo 3] |  |  |  |  |

[YOUR NUMBERS]

Fill these in from the walk. Leave them blank until then.

- Photos taken: [n]
- Names the guide was willing to give: [n]
- Times it said not sure: [n]
- Minutes I actually spent looking up: [n]

## What I built

Spotted is a pocket field guide and a very small social trail.

You take one photo. CLIP suggests a name from the guide, with a score and the next-best names. If the top score is under 0.12, or the gap to the next name is under 0.04, the screen does not pretend. It says **Not in my guide yet**, shows the top two or three as maybes, and lets you save the sighting under your own label. That label is not added to the model.

If the name is one you accept, **Look up** asks Gemma 3 270M, on the phone, for one concrete thing to notice in the next 60 seconds. The screen dims. A quiet chime marks the end. **What did you notice?** is saved into the sighting note.

You can still post the sighting, comment, and react. There is a map and a life list. The pin is off until you opt in. Threatened species are rounded to about 11 km before the server stores anything. Offline notes wait on the phone.

The people in the demo trail are fictional. The photographs are openly licensed reference images, labeled as such.

## Demo

Live: https://spotted-91b2.onrender.com

[DEMO VIDEO URL]

## Code

https://github.com/Esimuda/spotted

```
src/config/brand.ts          the one place to rename it
src/data/species.ts          the field guide the model is allowed to name
src/data/more-species.ts     West African and compound species added for this pass
src/lib/identify/rank.ts     the unsure threshold
src/lib/identify/look.ts     Gemma in the browser, one thing to notice
src/lib/privacy.ts           opt-in pin, coarse cell for sensitive species
```

## Open models

**Naming.** [CLIP ViT-B/32](https://github.com/openai/CLIP) (MIT), via Transformers.js, as `Xenova/clip-vit-base-patch32` in 8-bit. Zero-shot against the field-guide prompts only. BioCLIP (`imageomics/bioclip`, MIT) is the specialist I wanted, and it is not bundled, because the published weights are not a Transformers.js ONNX build. The task is the same when an export exists.

**Look up and the trail note.** [Gemma 3 270M Instruct](https://ai.google.dev/gemma/terms), `onnx-community/gemma-3-270m-it-ONNX`. Look up runs it in the browser: WebGPU with the `q4f16` build, WASM with `q4` if WebGPU is missing, cached after the first download. The server can still rewrite a short trail note from the same facts, or call an Ollama endpoint. The facts themselves are written in the repo, each with a source URL. The model is not allowed to invent a status.

| Piece | Model | License |
| --- | --- | --- |
| Names | `Xenova/clip-vit-base-patch32` | MIT |
| Look up, on the phone | `onnx-community/gemma-3-270m-it-ONNX` | Gemma Terms of Use |
| Trail note, on the server | Same Gemma build, or Ollama `gemma3:270m` | Gemma Terms of Use |
| Not bundled | `imageomics/bioclip` | MIT |
| Runtime | `@huggingface/transformers` | Apache-2.0 |

## How Gemma is used

Look up is the Gemma feature. After a name you accept, the button sends a short prompt: the common name and the behaviour sentence from the guide, and an instruction to answer with one sentence that starts with "Watch". The weights run in the page through Transformers.js. The browser cache keeps them.

If the sentence is the wrong shape, or the phone cannot run the model, the screen uses the guide's own behaviour line and says **Field guide**, not Gemma. The timer is the same either way. At the end it asks what you noticed and writes that into the note.

The older **Rewrite with Gemma** button is separate. It calls the server, and only when that host has models turned on. A free Render instance does not. The phone path is Look up.

## Where it runs

`render.yaml` is a blueprint for a free Render web service. Free instances are about 512 MB, which is enough for the trail and not enough to host CLIP and Gemma. On that plan the phone does the naming and the look-up. `/api/health` stays cheap so a keep-warm ping does not open the database.

## Why open-weight

A closed species API would have made the worse product. On a walk the signal drops. Cached CLIP still returns a name, and cached Gemma still has one thing for you to notice. The photo does not have to leave the phone for either of those. There is no per-name bill. The guide is a list of prompts, so a better open model can replace CLIP without a new vendor.

## Prize categories

- Best Use of Gemma
- Best Use of Render

[YOUR NAME]
