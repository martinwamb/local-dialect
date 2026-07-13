#!/usr/bin/env python3
"""
Generate MP3 pronunciation audio for a batch of (id, text) items in one language.

Dispatches to the right model per language:
  kikuyu -> BrianMwangi/African-Kikuyu-TTS (HuggingFace transformers pipeline)
  luo    -> CLEAR-Global/YourTTS-Luo (Coqui TTS checkpoint)
Any other language currently has no known TTS model and is rejected up front —
Kamba and Luhya stay text-only until one exists.

Usage:
  python scripts/generate_audio.py --language kikuyu --batch /tmp/batch.json

Batch file format: [{"id": "...", "text": "...", "outPath": "public/audio/..."}]
Progress is logged to stderr. The final line on stdout is a JSON array of
[{"id", "outPath", "success", "error"}] so a calling process can parse results
without scraping human-readable logs.

Prerequisites on server:
  pip install -r scripts/requirements-audio.txt
  apt-get install ffmpeg  (usually already present)

  # Luo only — download just the inference files (skip training logs/checkpoints,
  # ~2GB of the repo is unneeded training artifacts):
  huggingface-cli download CLEAR-Global/YourTTS-Luo \\
    best_model.pth config.json speakers.pth language_ids.json \\
    --local-dir /home/admin/tts-models/yourtts-luo
"""

import argparse
import json
import sys
from pathlib import Path

SUPPORTED_LANGUAGES = {"kikuyu", "luo"}


def log(msg: str) -> None:
    print(msg, file=sys.stderr)


def synthesize_kikuyu(items: list[dict], results: list[dict]) -> None:
    from transformers import pipeline
    import soundfile as sf
    from pydub import AudioSegment

    log("Loading BrianMwangi/African-Kikuyu-TTS (first run downloads ~500MB)...")
    tts = pipeline("text-to-speech", model="BrianMwangi/African-Kikuyu-TTS")
    log("Model loaded.")

    for item in items:
        out_path = Path(item["outPath"])
        try:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            result = tts(item["text"])
            wav_path = out_path.with_suffix(".wav")
            sf.write(str(wav_path), result["audio"].squeeze(), result["sampling_rate"])
            AudioSegment.from_wav(str(wav_path)).export(str(out_path), format="mp3", bitrate="128k")
            wav_path.unlink()
            log(f"  ✓ '{item['text']}' -> {out_path}")
            results.append({"id": item["id"], "outPath": item["outPath"], "success": True})
        except Exception as e:
            log(f"  ✗ '{item['text']}': {e}")
            results.append({"id": item["id"], "outPath": item["outPath"], "success": False, "error": str(e)})


def synthesize_luo(items: list[dict], results: list[dict]) -> None:
    # CLEAR-Global/YourTTS-Luo is a Coqui YourTTS checkpoint (multi-speaker,
    # multi-lingual embeddings) rather than a transformers pipeline. Model files
    # must already be downloaded locally (see the module docstring above for the
    # exact `huggingface-cli download` command) — we deliberately don't
    # auto-download ~1GB of weights from inside a batch worker run.
    from TTS.api import TTS
    import os

    model_dir = os.environ.get("YOURTTS_LUO_DIR", "/home/admin/tts-models/yourtts-luo")
    model_path = Path(model_dir) / "best_model.pth"
    config_path = Path(model_dir) / "config.json"
    if not model_path.exists() or not config_path.exists():
        raise FileNotFoundError(
            f"Luo TTS model not found at {model_dir} — download it first (see the module "
            f"docstring for the exact command), or set YOURTTS_LUO_DIR to its location."
        )

    log(f"Loading YourTTS-Luo from {model_dir}...")
    tts = TTS(model_path=str(model_path), config_path=str(config_path))
    speaker = tts.speakers[0] if getattr(tts, "speakers", None) else None
    language = tts.languages[0] if getattr(tts, "languages", None) else "luo"
    log(f"Model loaded. speaker={speaker!r} language={language!r}")

    for item in items:
        out_path = Path(item["outPath"])
        try:
            out_path.parent.mkdir(parents=True, exist_ok=True)
            wav_path = out_path.with_suffix(".wav")
            tts.tts_to_file(text=item["text"], speaker=speaker, language=language, file_path=str(wav_path))
            from pydub import AudioSegment

            AudioSegment.from_wav(str(wav_path)).export(str(out_path), format="mp3", bitrate="128k")
            wav_path.unlink()
            log(f"  ✓ '{item['text']}' -> {out_path}")
            results.append({"id": item["id"], "outPath": item["outPath"], "success": True})
        except Exception as e:
            log(f"  ✗ '{item['text']}': {e}")
            results.append({"id": item["id"], "outPath": item["outPath"], "success": False, "error": str(e)})


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--language", required=True, choices=sorted(SUPPORTED_LANGUAGES))
    parser.add_argument("--batch", required=True, help="Path to a JSON file: [{id, text, outPath}]")
    args = parser.parse_args()

    with open(args.batch, encoding="utf-8") as f:
        items = json.load(f)
    log(f"Loaded {len(items)} item(s) for language={args.language}")

    results: list[dict] = []
    try:
        if args.language == "kikuyu":
            synthesize_kikuyu(items, results)
        elif args.language == "luo":
            synthesize_luo(items, results)
    except Exception as e:
        # Model failed to load at all (missing deps/weights) — every item in
        # this batch failed, but still emit a well-formed result array.
        log(f"Fatal: could not load {args.language} model: {e}")
        for item in items:
            if not any(r["id"] == item["id"] for r in results):
                results.append({"id": item["id"], "outPath": item["outPath"], "success": False, "error": str(e)})

    print(json.dumps(results))


if __name__ == "__main__":
    main()
