---
title: Name it, then look up
published: false
tags: devchallenge, hf26challenge
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

I spend a lot of the week in community calls, docs, and group chats. Useful work, and also a very good way to forget that a kingfisher is hovering over a lagoon ten minutes from the road. Week 1 of this challenge asked for open models that get people off the screen. I took that literally. The phone should do one job, then get out of the hand.

I live in Nigeria, so the demo trail runs through places I want people to actually go: Lekki Conservation Centre, Okomu, Obudu, and Yankari. The guide is not only for those parks. A robin in a hedge and a dandelion in a pavement crack are in the list too.

The name on the app is a placeholder. Change `APP_NAME` in `src/config/brand.ts` and it follows the interface, the install name, and the tab title.

## What I Built

Fieldnote is a pocket field guide and a very small social trail.

You are outside. You see a bird, a lizard, a tree, an insect. You take one photo. An open vision model suggests a common name, a scientific name, and a confidence from a bundled field guide. The note already knows habitat, diet, behaviour, and conservation status, because those facts ship with the app. You can save the sighting, react, and comment. There is a map and a life list with a streak.

The screen is supposed to be the short part. The copy on the result says so: that is the name, the interesting part is still in front of you.

It is for people who walk, including people whose week is mostly indoors. I built the demo for a West African trail because that is home, and I kept the guide swappable so it is not a souvenir that only works in one country.

A few choices that matter when you are actually out:

- The pin is off until you opt in. A place name can still be a label.
- Threatened species, and a couple of timber trees, are rounded to about 11 km **before** the server stores anything. The exact point is never received.
- If the signal is gone, the note waits on the phone and syncs later. After the model weights are cached, the name can happen with no signal at all.

The people in the demo trail are fictional. The photographs are openly licensed reference images, labeled as such, so a judge can try the feed before taking a photo. They are not claimed as pictures those people took.

## Demo

[LIVE URL]

[DEMO VIDEO URL]

Until those exist, run it locally with the steps in the README. The demo trail loads with no account. On the field tab, choose **Server** if you want the first name in a couple of seconds, or **This phone** if you want CLIP in the browser.

## Code

[GITHUB REPO URL]

```
src/config/brand.ts          the one place to rename it
src/data/species.ts          the field guide the model is allowed to name
src/lib/identify/            CLIP ranking, and Gemma with a strict fallback
src/lib/privacy.ts           opt-in pin, coarse cell for sensitive species
src/lib/offline/store.ts     notes that wait for a signal
```

## How I Built It

The open models are the product, not a sticker on the side.

**Naming.** [CLIP ViT-B/32](https://github.com/openai/CLIP) (MIT), via Transformers.js, as `Xenova/clip-vit-base-patch32` in 8-bit. It does zero-shot classification against the prompts in the field guide. Nothing else. If the top score is thin, the screen says it is unsure and offers the next names. I checked it on the reference photos: pied kingfisher, forest elephant, rainbow agama, oil palm, citrus swallowtail, and European robin all came back as the top name.

I wanted BioCLIP for this. It is MIT, and it was trained on the tree of life, which is the right model for a field guide. The published weights are OpenCLIP checkpoints, not a Transformers.js ONNX build, so they do not run in the browser today. The code path is the same task. When an ONNX export exists, it drops in. I would rather ship a model that actually runs than a README that name-drops one that does not.

**The note under the name.** Habitat, diet, behaviour, and status are written into the guide. They show with no download and no signal. [Gemma 3 270M Instruct](https://ai.google.dev/gemma/terms) can rewrite those four facts into a short trail note. The button calls the server, which runs the `q4f16` ONNX build, or an OpenAI-compatible endpoint if you set `GEMMA_BASE_URL` (Ollama works). The same function accepts a browser device, but the shipped button does not download Gemma onto the phone. Naming on the trail is CLIP.

I am not going to pretend the 270M model is a naturalist. On the kingfisher it echoed the prompt. On the agama it wandered. If the rewrite does not name the species, or if it copies the instruction, the guide note stays. A small open model is allowed to try. It is not allowed to invent a conservation status. That is the point of keeping the facts in the repo.

**The trail.** Next.js, TypeScript, and a phone-shaped interface. SQLite through Node's built-in `node:sqlite`, so there is no database to rent. Sightings, comments, and reactions are a small API. Offline notes sit in IndexedDB and post when the phone is back. The map is Leaflet on CARTO's Voyager tiles. Sensitive pins are circles, not dots.

**Where it runs.** `render.yaml` is a blueprint for a free Render web service. Free instances are about 512 MB, which is enough for the trail and not enough for the models. On that plan the phone does the naming. Set `ENABLE_SERVER_MODELS=true` on a machine with about 2 GB free if you want the server to run the same CLIP, and more memory if you also want Gemma resident. I ran both on a larger box: CLIP named the samples above, and Gemma answered, then the filter kept the guide when the answer was not about the animal.

## Why Does Open Innovation Matter?

A closed species API would have made the worse product.

On a trail the signal drops. CLIP in the browser, cached after one download, still returns a name. A metered API does not.

The photo and the GPS point are the sensitive things, not the model weights. With a closed API you upload both to someone else's server in exchange for a label. Here the phone can name the photo without uploading it. If you do use the server, it is your server, and a threatened species is coarsened before that request is stored. I did not want a forest elephant, a grey parrot, or Sclater's monkey, which is endemic to southern Nigeria and endangered, to grow a precise public dot because someone wanted a fun fact.

It also costs nothing per name. A community trail that charged for every identification would die in the group chat, which is where a lot of my people already are.

And the model is not welded shut. The guide is a list of prompts. BioCLIP can replace CLIP. A larger Gemma, or a fine-tune, can replace the 270M narrator. Ollama can replace the in-process runtime. A closed key would have made every one of those a rewrite.

## My Agent Session

[OPTIONAL: DevRelay session or a link to the agent transcript. Judges like to see the work. Leave this out if you do not have one.]

## Prize Categories

- Best Use of Gemma
- Best Use of Render

Gemma is the trail-note model, run through Transformers.js, with an Ollama-compatible endpoint if you already have a Gemma build. Render is the blueprint in `render.yaml`: the social trail on the free web service, and the same open models on the server when the instance has the RAM.

## When I took it outside

[YOUR OUTSIDE ANECDOTE]

Write this after you use the app on a real walk. Say what you saw, whether the name was close, and whether you actually put the phone down. Do not leave this placeholder in the published post. A true paragraph is worth more than a polished invented one.

[YOUR NAME]
