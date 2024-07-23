import { vec, Vec, VectorBinding, xyzArray } from "@grinstead/ambush";

export function Marble(props: { position: Vec }) {
  return (
    <VectorBinding
      label="iMarblePos"
      group={0}
      id={8}
      value={xyzArray(props.position)}
    />
  );
}

export function HideMarble() {
  return <Marble position={vec(999, 999, 999)} />;
}
