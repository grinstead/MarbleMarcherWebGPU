import "./Countdown.css";

export function Countdown(props: { children: string }) {
  return <div class="countdown fade-out">{props.children}</div>;
}
