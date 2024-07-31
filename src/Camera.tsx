import {
  BufferBinding,
  VEC_Y,
  VEC_Z,
  Vec3,
  scale,
  vec3,
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
  worldMatrix: Float32Array;
  marble: Vec3;
  offset: Vec3;
};

export function MarbleCamera(props: MarbleCameraProps) {
  const binary = new MatrixBinary();
  const matrix = createMemo(() => {
    const { marbleRadius, offset } = props;

    binary.set(IDENTITY);
    rotateAboutX(binary, offset.y);
    rotateAboutY(binary, offset.x);
    binary.leftMultiply(props.worldMatrix);

    const mat = binary.snapshot();

    const distance = marbleRadius * offset.z;

    let pos = props.marble
      .plus(scale(binary.multVec(VEC_Z), distance))
      .plus(scale(binary.multVec(VEC_Y), distance * 0.1));

    // set the translation col to xyz position
    mat.set(pos.xyz(), 12);

    return mat;
  });

  return <FreeCamera matrix={matrix()} />;
}

export function OrbitCamera(props: {
  target: Vec3;
  offset: Vec3;
  marbleRadius?: number;
}) {
  return (
    <MarbleCamera
      marble={props.target}
      offset={props.offset}
      worldMatrix={IDENTITY}
      marbleRadius={props.marbleRadius ?? 0}
    />
  );
}

export function FreeCamera(props: { matrix: Float32Array }) {
  return <BufferBinding label="iMat" group={0} id={0} value={props.matrix} />;
}

export function defaultOffset(lookX: number) {
  return vec3(lookX, -0.3, 15);
}
