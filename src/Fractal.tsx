import {
  ScalarBinding,
  Vec3,
  VectorBinding,
  rgb,
  rgbArray,
  vec3,
} from "@grinstead/ambush";
import { FractalShape, LevelData } from "./LevelData.ts";
import { FAR_AWAY } from "./hacks.ts";

export type FractalProps = FractalShape &
  Pick<LevelData, "color" | "marbleRadius" | "isPlanet" | "flagPosition">;

export function Fractal(props: FractalProps) {
  return (
    <>
      <ScalarBinding label="iFracScale" group={0} id={3} value={props.scale} />
      <VectorBinding
        label="iFracAng1"
        group={0}
        id={4}
        value={sinCosTanAngle(props.angle1)}
      />
      <VectorBinding
        label="iFracAng2"
        group={0}
        id={5}
        value={sinCosTanAngle(props.angle2)}
      />
      <VectorBinding
        label="iFracShift"
        group={0}
        id={6}
        value={props.offset.xyz()}
      />
      <VectorBinding
        label="iFracCol"
        group={0}
        id={7}
        value={rgbArray(props.color)}
      />
      <ScalarBinding
        label="iMarbleRad"
        group={0}
        id={9}
        value={props.marbleRadius}
      />
      <ScalarBinding
        label="iFlagScale"
        group={0}
        id={10}
        value={(props.isPlanet ? -1 : 1) * props.marbleRadius}
      />
      <VectorBinding
        label="iFlagPos"
        group={0}
        id={11}
        value={props.flagPosition.xyz()}
      />
    </>
  );
}

function sinCosTanAngle(angle: number): [number, number, number, number] {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  return [sin, cos, sin / cos, angle];
}

// array of [x, y, z, x2, y2, z2, ...]
const pointStack: Array<number> = [];
const FRACTAL_ITERS = 16;

export function nearestPoint(fractal: FractalShape, original: Vec3) {
  let { x, y, z } = original;

  const { scale, offset } = fractal;
  let [rotZs, rotZc] = sinCosTanAngle(fractal.angle1);
  let [rotXs, rotXc] = sinCosTanAngle(fractal.angle2);

  for (let i = 0; i < FRACTAL_ITERS; ++i) {
    pointStack.push(x, y, z);

    // absolute fold
    x = Math.abs(x);
    y = Math.abs(y);
    z = Math.abs(z);

    // rotation z
    [x, y] = [rotZc * x + rotZs * y, rotZc * y - rotZs * x];

    // menger fold
    pointStack.push(x, y, z);
    let a = Math.min(x - y, 0);
    x -= a;
    y += a;
    a = Math.min(x - z, 0);
    x -= a;
    z += a;
    a = Math.min(y - z, 0);
    y -= a;
    z += a;

    // rotation X
    [y, z] = [rotXc * y + rotXs * z, rotXc * z - rotXs * y];

    // scale + translate
    x *= scale;
    y *= scale;
    z *= scale;

    x += offset.x;
    y += offset.y;
    z += offset.z;
  }

  // nearest point
  let nx = clamp(x, -6, 6);
  let ny = clamp(y, -6, 6);
  let nz = clamp(z, -6, 6);

  // reverse our angles
  rotZs = -rotZs;
  rotXs = -rotXs;

  // unfold the nearest point
  for (let i = 0; i < FRACTAL_ITERS; i++) {
    // scale + translate
    nx -= offset.x;
    ny -= offset.y;
    nz -= offset.z;

    nx /= scale;
    ny /= scale;
    nz /= scale;

    // rotation X
    [ny, nz] = [rotXc * ny + rotXs * nz, rotXc * nz - rotXs * ny];

    // menger unfold
    z = pointStack.pop()!;
    y = pointStack.pop()!;
    x = pointStack.pop()!;

    const mx = Math.max(x, y);
    if (Math.min(x, y) < Math.min(mx, z)) {
      [ny, nz] = [nz, ny];
    }
    if (mx < z) {
      [nx, nz] = [nz, nx];
    }
    if (x < y) {
      [nx, ny] = [ny, nx];
    }

    // rotation Z
    [nx, ny] = [rotZc * nx + rotZs * ny, rotZc * ny - rotZs * nx];

    // absolute unfold
    z = pointStack.pop()!;
    y = pointStack.pop()!;
    x = pointStack.pop()!;

    if (x < 0) nx = -nx;
    if (y < 0) ny = -ny;
    if (z < 0) nz = -nz;
  }

  return vec3(nx, ny, nz);
}

function clamp(x: number, min: number, max: number) {
  return x < min ? min : x > max ? max : x;
}

const GENERIC_FRACTAL = {
  color: rgb(-0.2, -0.1, -0.6),
  marbleRadius: 1,
  isPlanet: false,
  flagPosition: FAR_AWAY,
};

export function genericFractal(frame: number = 0): FractalProps {
  return {
    ...GENERIC_FRACTAL,
    scale: 1.6,
    angle1: 2 + 0.5 * Math.cos(frame * 0.0021),
    angle2: Math.PI + 0.5 * Math.cos(frame * 0.000287),
    offset: vec3(
      -4 + 0.5 * Math.sin(frame * 0.00161),
      -1 + 0.2 * Math.sin(frame * 0.00123),
      -1 + 0.1 * Math.cos(frame * 0.00137)
    ),
  };
}
