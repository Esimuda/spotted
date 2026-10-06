export type EngineChoice = "phone" | "server";

const ENGINE_KEY = "fieldnote-engine";
const SHARE_KEY = "fieldnote-share";

export function readEngine(): EngineChoice {
  if (typeof window === "undefined") return "phone";
  return window.localStorage.getItem(ENGINE_KEY) === "server" ? "server" : "phone";
}

export function writeEngine(value: EngineChoice) {
  window.localStorage.setItem(ENGINE_KEY, value);
}

export function readShareDefault(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SHARE_KEY) === "on";
}

export function writeShareDefault(on: boolean) {
  window.localStorage.setItem(SHARE_KEY, on ? "on" : "off");
}
