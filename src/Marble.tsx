import { Vec3, VectorBinding } from "@grinstead/ambush";
import { FAR_AWAY } from "./hacks.ts";

export function Marble(props: { position: Vec3 }) {
  return (
    <VectorBinding
      label="iMarblePos"
      group={0}
      id={8}
      value={props.position.xyz()}
    />
  );
}

export function HideMarble() {
  return <Marble position={FAR_AWAY} />;
}
