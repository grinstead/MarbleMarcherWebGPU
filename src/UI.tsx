import { createMemo, For, Show } from "solid-js";

export function TimeCounter(props: { seconds: number }) {
  const minutes = createMemo(() => Math.floor(props.seconds / 60));
  return (
    <h2 class="timer">
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
    </h2>
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
