import { JSX } from "solid-js";
import "./OverlayMenu.css";

export function OverlayMenu({ onSelect }: { onSelect: (option: string) => void }): JSX.Element {
  return (
    <div class="overlay-menu">
      <div class="title">Marble Marcher</div>
      <button onClick={() => onSelect('Play')}>Play</button>
      <button onClick={() => onSelect('Levels')}>Levels</button>
      <button onClick={() => onSelect('Controls')}>Controls</button>
      <button onClick={() => onSelect('Screensaver')}>Screensaver</button>
      <button onClick={() => onSelect('Exit')}>Exit</button>
    </div>
  );
}
