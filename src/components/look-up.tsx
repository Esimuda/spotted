"use client";

import { useEffect, useRef, useState } from "react";
import type { Species } from "@/data/species";
import type { LookResult } from "@/lib/identify/look";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const LOOK_SECONDS = 60;

type Stage = "closed" | "loading" | "watching" | "ask";

export function LookUp({
  species,
  onNotice,
}: {
  species: Species;
  onNotice: (line: string) => void;
}) {
  const [stage, setStage] = useState<Stage>("closed");
  const [prompt, setPrompt] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [status, setStatus] = useState("Opening Gemma on this phone");
  const [seconds, setSeconds] = useState(LOOK_SECONDS);
  const [noticed, setNoticed] = useState("");
  const [saved, setSaved] = useState(false);
  const ended = useRef(false);

  useEffect(() => {
    if (stage !== "watching") return;
    ended.current = false;
    const id = window.setInterval(() => {
      setSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(id);
          if (!ended.current) {
            ended.current = true;
            finishWatch();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [stage]);

  function finishWatch() {
    chime();
    setStage("ask");
  }

  async function start() {
    setStage("loading");
    setSaved(false);
    setNoticed("");
    setSeconds(LOOK_SECONDS);
    setStatus("Opening Gemma on this phone");
    setSourceLabel("");
    const { lookUpOnDevice, guideLook } = await import("@/lib/identify/look");
    const result = await lookUpOnDevice(species, (progress) => {
      if (typeof progress.progress === "number") setStatus(`Bringing Gemma along · ${Math.round(progress.progress)}%`);
      else if (progress.status === "ready" || progress.status === "done") setStatus("Asking for one thing to notice");
    });
    openWatch(result.text ? result : { ...result, text: guideLook(species) });
  }

  function openWatch(result: LookResult) {
    setPrompt(result.text);
    setSourceLabel(labelFor(result));
    setSeconds(LOOK_SECONDS);
    setStage("watching");
  }

  function endEarly() {
    if (ended.current) return;
    ended.current = true;
    finishWatch();
  }

  function keepNote() {
    const line = noticed.trim();
    if (!line) return;
    onNotice(line);
    setSaved(true);
    setStage("closed");
  }

  return (
    <>
      <div className="rounded-3xl bg-dusk px-5 py-5 text-cream">
        <p className="kicker text-gold">Look up</p>
        <p className="mt-2 font-display text-3xl leading-none">One minute with this, not the screen.</p>
        <p className="mt-3 text-sm leading-6 text-cream/80">
          Gemma reads the field note and names a single thing to notice. Then the phone dims.
        </p>
        <Button variant="clay" className="mt-4" onClick={() => void start()} disabled={stage === "loading"}>
          {stage === "loading" ? "Finding one thing…" : "Look up"}
        </Button>
      </div>

      {stage !== "closed" ? (
        <div
          data-screen={stage === "watching" ? "lookup-timer" : "lookup-wait"}
          className="lookup-veil fixed inset-0 z-50 flex flex-col justify-between bg-dusk px-6 py-10 text-cream"
          role="dialog"
          aria-modal="true"
          aria-label="Look up"
        >
          <div>
            <p className="kicker text-gold">{stage === "ask" ? "Back" : "Look up"}</p>
            <p className="mt-3 text-sm text-cream/70">{species.commonName}</p>
          </div>

          {stage === "loading" ? (
            <div>
              <p className="font-display text-4xl leading-[1.05]">{status}</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-cream/75">
                The first time, the open model downloads and stays on this phone. After that it is quiet.
              </p>
            </div>
          ) : null}

          {stage === "watching" ? (
            <div data-prompt={prompt}>
              <p className="max-w-sm font-display text-4xl leading-[1.05]">{prompt}</p>
              <p className="mt-8 font-display text-7xl tabular-nums leading-none">{seconds}</p>
              <p className="mt-3 text-sm text-cream/70">{sourceLabel}</p>
            </div>
          ) : null}

          {stage === "ask" ? (
            <div className="max-w-sm">
              <p className="font-display text-4xl leading-[1.05]">What did you notice?</p>
              <Textarea
                value={noticed}
                onChange={(event) => setNoticed(event.target.value)}
                maxLength={240}
                placeholder="A line is enough."
                className="mt-4 border-cream/20 bg-cream/10 text-cream placeholder:text-cream/40"
              />
              <Button variant="clay" className="mt-4" onClick={keepNote} disabled={!noticed.trim()}>
                Keep it in the note
              </Button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {stage === "watching" ? (
              <button type="button" className="text-sm text-cream/70" onClick={endEarly}>
                I looked
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="text-sm text-cream/70"
              onClick={() => setStage("closed")}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
      {saved ? <p className="text-sm text-ink-soft">Saved into the note below.</p> : null}
    </>
  );
}

function labelFor(result: LookResult): string {
  if (result.source === "gemma" && result.device === "webgpu") return "Gemma 3 270M on this phone · WebGPU";
  if (result.source === "gemma") return "Gemma 3 270M on this phone";
  if (result.device === "guide") return "Field guide · this phone could not run Gemma";
  return "Field guide · Gemma did not stay with the facts";
}

function chime() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(494, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.85);
    osc.onended = () => void ctx.close();
  } catch {
    /* a phone without audio still gets the question */
  }
  try {
    navigator.vibrate?.([28, 50, 28]);
  } catch {
    /* vibration is optional */
  }
}
