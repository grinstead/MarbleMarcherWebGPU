import { AudioManager, SoundEffect } from "@grinstead/ambush";
import bounce1 from "./assets/bounce1.wav";
import bounce2 from "./assets/bounce2.wav";
import bounce3 from "./assets/bounce3.wav";

export const bounceSounds = [bounce1, bounce2, bounce3].map(
  (s) => new SoundEffect(new URL(s, import.meta.url))
);

export function playBounceSound(audio: AudioManager, deltaV: number) {
  if (!bounceSounds) return;

  if (deltaV > 0.5) {
    audio.play(bounceSounds, bounceSounds[0]);
  } else if (deltaV > 0.25) {
    audio.play(bounceSounds, bounceSounds[1]);
  } else if (deltaV > 0.05) {
    audio.play(bounceSounds, bounceSounds[2], deltaV / 0.25);
  }
}
