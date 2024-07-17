import {
  BufferBinding,
  Vec,
  addVec,
  scale,
  vec,
  xyzArray,
} from "@grinstead/ambush";
import {
  IDENTITY,
  MatrixBinary,
  rotateAboutX,
  rotateAboutY,
} from "./Matrix.ts";
import { createMemo } from "solid-js";

export type MarbleCameraProps = {
  marbleRadius: number;
  marble: Vec;
  offset: Vec;
};

export function MarbleCamera(props: MarbleCameraProps) {
  const binary = new MatrixBinary();
  const matrix = createMemo(() => {
    const { marbleRadius, offset } = props;

    binary.set(IDENTITY);
    rotateAboutX(binary, offset.y);
    rotateAboutY(binary, offset.x);

    const mat = binary.snapshot();

    const distance = marbleRadius * offset.z;

    let pos = props.marble;
    pos = addVec(pos, binary.multVec(vec(0, 0, distance)));
    pos = addVec(pos, scale(binary.colY(), distance * 0.1));

    // set the translation col to xyz position
    mat.set(xyzArray(pos), 12);

    return mat;
  });

  return <BufferBinding label="iMat" group={0} id={0} value={matrix()} />;
}
