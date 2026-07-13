import { spawn } from "child_process";

const EDGE_TTS_BIN = process.env.EDGE_TTS_BIN ?? "edge-tts";
const NARRATION_VOICE = process.env.NARRATION_VOICE ?? "en-US-AriaNeural";

// Narrator/instructional voice-over (lesson intros, quiz feedback, UI text) —
// language-agnostic English/Swahili narration, distinct from dialect-word
// pronunciation audio (see generate_audio.py). edge-tts is network-based
// Microsoft neural TTS: near-zero local CPU/disk cost, unlike a local model.
export function synthesizeNarration(text: string, outPath: string, voice = NARRATION_VOICE): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(EDGE_TTS_BIN, ["--text", text, "--voice", voice, "--write-media", outPath]);
    let stderr = "";
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`edge-tts failed (exit ${code}): ${stderr}`));
    });
    proc.on("error", reject);
  });
}
