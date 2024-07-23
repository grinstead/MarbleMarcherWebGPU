import { AudioManager } from "./AudioManager.ts";
import bounce1 from "./assets/bounce1.wav";
import bounce2 from "./assets/bounce2.wav";
import bounce3 from "./assets/bounce3.wav";

let _audio: undefined | AudioManager;

function audio() {
  return (_audio ??= new AudioManager());
}

let bounceSounds: undefined | Array<AudioBuffer>;

export function loadBounceSounds() {
  if (bounceSounds) return;

  return Promise.all(
    [bounce1, bounce2, bounce3].map((b) =>
      audio().loadSound(new URL(b, import.meta.url))
    )
  ).then((sounds) => {
    bounceSounds = sounds;
  });
}

export function playBounceSound(deltaV: number) {
  if (!bounceSounds) return;

  if (deltaV > 0.5) {
    audio().playSound(bounceSounds, bounceSounds[0]);
  } else if (deltaV > 0.25) {
    audio().playSound(bounceSounds, bounceSounds[1]);
  } else if (deltaV > 0.05) {
    audio().playSound(bounceSounds, bounceSounds[2], deltaV / 0.25);
  }
}
