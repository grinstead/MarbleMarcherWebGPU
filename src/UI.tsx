import { classnames } from "@grinstead/classnames";
import { createMemo, For, Show } from "solid-js";

export function TimeCounter(props: {
  seconds: number;
  overhead?: boolean;
  isRecord?: boolean;
}) {
  return (
    <h2
      class={classnames(
        "timer",
        props.overhead && "overhead",
        props.isRecord && "victory"
      )}
    >
      <TimerText seconds={props.seconds} />
    </h2>
  );
}

export function TimerText(props: { seconds: number }) {
  const minutes = createMemo(() => Math.floor(props.seconds / 60));

  return (
    <>
      <Show
        when={minutes() >= 100}
        fallback={<DoubleDigit value={minutes()} />}
      >
        <For each={minutes().toString().split("")}>
          {(char) => <span>{char}</span>}
        </For>
      </Show>
      :
      <DoubleDigit value={Math.floor(props.seconds) % 60} />.
      <DoubleDigit value={Math.floor(props.seconds * 100) % 100} />
    </>
  );
}

function DoubleDigit(props: { value: number }) {
  return (
    <>
      <span>{Math.floor(props.value / 10)}</span>
      <span>{props.value % 10}</span>
    </>
  );
}
