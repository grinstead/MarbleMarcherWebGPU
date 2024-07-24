import { AudioManager, SoundEffect } from "@grinstead/ambush";
import bounce1 from "./assets/bounce1.wav";
import bounce2 from "./assets/bounce2.wav";
import bounce3 from "./assets/bounce3.wav";
import shatter from "./assets/shatter.wav";
import goal from "./assets/goal.wav";

export const sounds = {
  bounces: [bounce1, bounce2, bounce3].map(
    (s) => new SoundEffect(new URL(s, import.meta.url))
  ),
  shatter: new SoundEffect(new URL(shatter, import.meta.url)),
  goal: new SoundEffect(new URL(goal, import.meta.url)),
};

export const MARBLE_SOURCE = Symbol("marble");

export function playBounceSound(audio: AudioManager, deltaV: number) {
  if (deltaV > 0.5) {
    audio.play(MARBLE_SOURCE, sounds.bounces[0]);
  } else if (deltaV > 0.25) {
    audio.play(MARBLE_SOURCE, sounds.bounces[1]);
  } else if (deltaV > 0.05) {
    audio.play(MARBLE_SOURCE, sounds.bounces[2], deltaV / 0.25);
  }
}
