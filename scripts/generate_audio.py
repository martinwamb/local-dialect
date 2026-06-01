#!/usr/bin/env python3
"""
Generate MP3 audio files for Kikuyu words/phrases using BrianMwangi/African-Kikuyu-TTS.

Usage:
  python scripts/generate_audio.py [--input src/data/audio-wordlist.json] [--output public/audio]

Prerequisites on server:
  pip install -r scripts/requirements-audio.txt
  apt-get install ffmpeg  (usually already present)
"""

import argparse
import json
import os
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="src/data/audio-wordlist.json")
    parser.add_argument("--output", default="public/audio/kikuyu")
    args = parser.parse_args()

    with open(args.input, encoding="utf-8") as f:
        wordlist = json.load(f)

    print(f"Loaded {len(wordlist)} items from {args.input}")

    try:
        from transformers import pipeline
        import soundfile as sf
        from pydub import AudioSegment
    except ImportError as e:
        print(f"Missing dependency: {e}")
        print("Run: pip install -r scripts/requirements-audio.txt")
        sys.exit(1)

    print("Loading BrianMwangi/African-Kikuyu-TTS model (first run will download ~500MB)...")
    tts = pipeline("text-to-speech", model="BrianMwangi/African-Kikuyu-TTS")
    print("Model loaded.")

    generated = 0
    skipped = 0
    errors = 0

    for item in wordlist:
        text = item["text"]
        slug = item["slug"]
        category = item["category"]
        unit = item["unit"]

        out_dir = Path(args.output) / category / unit
        out_dir.mkdir(parents=True, exist_ok=True)
        mp3_path = out_dir / f"{slug}.mp3"

        if mp3_path.exists():
            print(f"  ↷ Skip (exists): {mp3_path}")
            skipped += 1
            continue

        print(f"  ▶ Generating: '{text}' → {mp3_path}")
        try:
            result = tts(text)
            audio_array = result["audio"]
            sample_rate = result["sampling_rate"]

            # Write WAV to temp file, then convert to MP3
            wav_path = mp3_path.with_suffix(".wav")
            sf.write(str(wav_path), audio_array.squeeze(), sample_rate)

            audio = AudioSegment.from_wav(str(wav_path))
            audio.export(str(mp3_path), format="mp3", bitrate="128k")
            wav_path.unlink()  # remove temp WAV

            generated += 1
        except Exception as e:
            print(f"  ✗ Error for '{text}': {e}")
            errors += 1

    print(f"\nDone: {generated} generated, {skipped} skipped, {errors} errors")
    print(f"Files saved to {args.output}/")

if __name__ == "__main__":
    main()
