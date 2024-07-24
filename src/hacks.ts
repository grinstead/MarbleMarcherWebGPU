import { AudioManager, SoundEffect } from "@grinstead/ambush";
import bounce1 from "./assets/bounce1.wav";
import bounce2 from "./assets/bounce2.wav";
import bounce3 from "./assets/bounce3.wav";
import shatter from "./assets/shatter.wav";
import goal from "./assets/goal.wav";
import countDown from "./assets/count_down.wav";
import countGo from "./assets/count_go.wav";
import menuHover from "./assets/menu_hover.wav";
import menuClick from "./assets/menu_click.wav";

function soundEffect(s: string) {
  return new SoundEffect(new URL(s, import.meta.url));
}

export const sounds = {
  menuHover: soundEffect(menuHover),
  menuClick: soundEffect(menuClick),
  countDown: soundEffect(countDown),
  countGo: soundEffect(countGo),
  bounces: [bounce1, bounce2, bounce3].map(soundEffect),
  goal: soundEffect(goal),
  shatter: soundEffect(shatter),
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
