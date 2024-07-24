import { createSignal, onCleanup } from "solid-js";
import "./Timer.css";

export function Timer() {
  const [elapsedTime, setElapsedTime] = createSignal(0);

  const timer = setInterval(() => {
    setElapsedTime(prevTime => prevTime + 1);
  }, 16.67);

  onCleanup(() => clearInterval(timer));

  const formatTime = (time: number) => {
    const minutes = String(Math.floor(time / 3600)).padStart(2, '0');
    const seconds = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
    const milliseconds = String(time % 60).padStart(2, '0');
    return `${minutes}:${seconds}:${milliseconds}`;
  };

  return (
    <div class="timer">
      {formatTime(elapsedTime())}
    </div>
  );
}
