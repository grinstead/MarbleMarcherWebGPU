import { useGameEngine } from "@grinstead/ambush";
import "./Countdown.css";
import { createEffect } from "solid-js";
import { sounds } from "./hacks.ts";

const COUNTDOWN = Symbol("Countdown");

export function Countdown(props: { launchSound?: boolean; children: string }) {
  const engine = useGameEngine();

  createEffect(() => {
    // read the text, so we restart the sound if they change
    props.children;

    engine.audio.play(
      COUNTDOWN,
      props.launchSound ? sounds.countGo : sounds.countDown
    );
  });

  return <div class="countdown fade-out">{props.children}</div>;
}
