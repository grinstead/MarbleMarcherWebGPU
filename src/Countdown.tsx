import { createSignal, onCleanup, createEffect } from "solid-js";
import "./Countdown.css";

export function Countdown({ onCountdownEnd }: { onCountdownEnd: () => void }) {
  const [count, setCount] = createSignal(3);
  const [visible, setVisible] = createSignal(true);

  createEffect(() => {
    setVisible(false);
    setTimeout(() => {
      setVisible(true);
    }, 0); 
  });

  const countdown = setInterval(() => {
    setVisible(false);
    setTimeout(() => {
      setCount((prevCount) => {
        if (prevCount > 0) {
          return prevCount - 1;
        }
        clearInterval(countdown);
        onCountdownEnd(); 
        return 0;
      });
      setVisible(true); 
    }, 900); 
  }, 1000); 

  onCleanup(() => clearInterval(countdown));

  return (
    <>
      {count() > 0 && (
        <div class={`countdown ${!visible() ? 'fade-out' : ''}`}>
          {count()}
        </div>
      )}
    </>
  );
}
