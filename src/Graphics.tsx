import {
  BufferBinding,
  RenderPipeline,
  ScalarBinding,
  VectorBinding,
  rgbArray,
  xyzArray,
} from "@grinstead/ambush";
import { GameStore } from "./GameStore.ts";

const RENDER_QUAD = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragUV: vec2f,
}

// just renders 4 points that cover the canvas, all work done in fragment shader
@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  const fragPoints = array(
    vec2f(0, 0),
    vec2f(1, 0),
    vec2f(0, 1),
    vec2f(1, 1),
  );

  let uv = fragPoints[index];

  return VertexOutput(
    vec4f(2 * uv - 1, 0, 1),
    uv,
  );
}`;

export type GameCanvasProps = {
  store: GameStore;
};

export function Graphics(props: GameCanvasProps) {
  const MyTestShaderCode = `
${RENDER_QUAD}

// matrix expressed in meters, implictly encodes focal length
// because when rendering we shoot out rays from the "sensor"
// which is the square from (-.5, -.5, -1)x(.5, .5, -1), shot
// at the origin, where both of those values have been multiplied
// by the camera
@group(0) @binding(0) var<uniform> camera: mat4x4f;
@group(0) @binding(1) var<uniform> iResolution: vec2f;

@group(1) @binding(0) var<uniform> iFracScale: f32;
@group(1) @binding(1) var<uniform> iFracAng1: f32;
@group(1) @binding(2) var<uniform> iFracAng2: f32;
@group(1) @binding(3) var<uniform> iFracShift: vec3f;
@group(1) @binding(4) var<uniform> iFracCol: vec3f;
@group(1) @binding(5) var<uniform> iMarbleRad: f32;

@group(2) @binding(0) var<uniform> iMarblePos: vec3f;

fn inCamera(position: vec4f) -> vec3f {
  let transformed = camera * position;
  return transformed.xyz / transformed.w;
}

const AMBIENT_OCCLUSION_COLOR_DELTA = vec3f(0.7);
const AMBIENT_OCCLUSION_STRENGTH = 0.008;
const BACKGROUND_COLOR = vec4f(0.6, 0.8, 1.0, 1.0);
const CIRCLE_ORIGIN = vec3f(0, 0, 40);
const CIRCLE_RADIUS = 1.0f;
const EPSILON = 1e-5;
const FOCAL_DIST = 1.73205080757;
const FRACTAL_LEVELS = 16;
const LIGHT_DIRECTION = vec3f(-0.36, 0.8, 0.48);
const LIGHT_COLOR = vec3f(1.0, 0.95, 0.8);
const MAX_DISTANCE = 30.0;
const MAX_STEPS = 1000;
const SHADOW_DARKNESS = 0.7;
const SHADOW_SHARPNESS = 10.0;
const SPECULAR_HIGHLIGHT = 40;
const SPECULAR_MULT = 0.25;
const SUN_SHARPNESS = 2.0;
const SUN_SIZE = 0.004;
const VIGNETTE_STRENGTH = 0.5;

const ID_VOID = 0;
const ID_FRACTAL = 1;
const ID_MARBLE = 2;
const ID_FLAG = 3;

struct DistanceAndShape {
  headroom: f32,
  shape: u32,
}

struct RayMarchResult {
  // The position we ended the ray march in
  endPoint: vec4f,
  // the amount of remaining distance
  headroom: f32,
  minHeadroom: f32,
  distance: f32,
  steps: f32,
  shape: u32,
}

fn rotX(p: vec4f, a: f32) -> vec4f {
  let c = cos(a);
  let s = sin(a);
  return vec4f(p.x, c * p.y + s * p.z, c * p.z - s * p.y, p.w);
}

fn rotZ(p: vec4f, a: f32) -> vec4f {
  let c = cos(a);
  let s = sin(a);
  return vec4f(c * p.x + s * p.y, c * p.y - s * p.x, p.zw);
}

fn max3(a: f32, b: f32, c: f32) -> f32 {
  return max(max(a, b), c);
}

fn max4(a: f32, b: f32, c: f32, d: f32) -> f32 {
  return max(max(a, b), max(c, d));
}

/////////////////////////////////////////////////////////////////////////////
// Geometry
/////////////////////////////////////////////////////////////////////////////

fn mengerFold(point: vec4f) -> vec4f {
  var p = point;
  
  var a = min(p.x - p.y, 0.0);
  p.x -= a;
  p.y += a;

  a = min(p.x - p.z, 0.0);
  p.x -= a;
  p.z += a;

  a = min(p.y - p.z, 0.0);
  p.y -= a;
  p.z += a;

  return p;
}

fn de_sphere(p: vec3f, r: f32) -> f32 {
	return length(p) - r;
}

fn de_box(p: vec4f, sides: vec3f) -> f32 {
	let a = abs(p.xyz) - sides;
	return (min(max3(a.x, a.y, a.z), 0.0) + length(max(a, vec3f()))) / p.w;
}

fn de_tetrahedron(p: vec3f, r: f32) -> f32 {
	let md = max4(
    -p.x - p.y - p.z,
     p.x + p.y - p.z,
		-p.x + p.y + p.z,
     p.x - p.y + p.z
  );
	return (md - r) / sqrt(3.0);
}

fn de_capsule(p: vec3f, h: f32, r: f32) -> f32 {
	return length(p - vec3f(0, clamp(p.y, -h, h), 0)) - r;
}

fn de_fractal(point: vec4f) -> f32 {
  var p = point;
  for (var i = 0; i < FRACTAL_LEVELS; i++) {
    p = vec4f(abs(p.xyz), p.w);
    p = rotZ(p, iFracAng1);
    p = mengerFold(p);
    p = rotX(p, iFracAng2);
    p *= iFracScale;
    p += vec4f(iFracShift, 0.);
  }

  return de_box(p, vec3f(6.));
}

fn col_fractal(point: vec4f) -> vec4f {
  var orbit = vec3f();
  var p = point;
  for (var i = 0; i < FRACTAL_LEVELS; i++) {
    p = vec4f(abs(p.xyz), p.w);
    p = rotZ(p, iFracAng1);
    p = mengerFold(p);
    p = rotX(p, iFracAng2);
    p *= iFracScale;
    p += vec4f(iFracShift, 0.);
    orbit = max(orbit, p.xyz * iFracCol);
  }

  return vec4f(orbit, 1);
}

fn estimateHeadroom(point: vec4f) -> DistanceAndShape {
  var result = DistanceAndShape(
    de_fractal(point),
    ID_FRACTAL,
  );
  
  let dist = de_sphere(point.xyz - iMarblePos, iMarbleRad);
  if (dist <= result.headroom) {
    result.headroom = dist;
    result.shape = ID_MARBLE;
  }

  return result;
}

/////////////////////////////////////////////////////////////////////////////
// Main Code
/////////////////////////////////////////////////////////////////////////////

// http://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
fn calcNormal(point: vec4f, offset: f32) -> vec3f {
  let k = vec3f(1, -1, 0);
	return normalize(
    k.xyy * estimateHeadroom(point + k.xyyz * offset).headroom +
		k.yyx * estimateHeadroom(point + k.yyxz * offset).headroom +
		k.yxy * estimateHeadroom(point + k.yxyz * offset).headroom +
		k.xxx * estimateHeadroom(point + k.xxxz * offset).headroom
  );
}

fn rayMarch(start: vec4f, direction: vec3f, sharpness: f32) -> RayMarchResult {
  let FOVperPixel = 1.0 / max(iResolution.x, 900.0);

  var steps = 0;
  var position = start;
  var distance = 0.;
  var minHeadroom = 1.;
  loop {
    let adjustedMin = max(FOVperPixel * distance, EPSILON);
 
    let estimate = estimateHeadroom(position);

    if (estimate.headroom < adjustedMin || distance > MAX_DISTANCE || steps >= MAX_STEPS) {
      return RayMarchResult(
        position,
        estimate.headroom,
        minHeadroom,
        distance,
        f32(steps) + select(
          0., 
          estimate.headroom / adjustedMin,
          estimate.headroom < adjustedMin
        ),
        select(estimate.shape, ID_VOID, distance > MAX_DISTANCE || steps >= MAX_STEPS)
      );
    }

    continuing {
      steps++;
      distance += estimate.headroom;
      position += vec4f(estimate.headroom * direction, 0);
      minHeadroom = min(minHeadroom, sharpness * estimate.headroom / distance);
    }
  }
}

fn fractalSurface(dir: vec3f, march: RayMarchResult) -> vec3f {
  let FOVperPixel = 1.0 / max(iResolution.x, 900.0);
  let minDist = max(FOVperPixel * march.distance, EPSILON);
  let norm = calcNormal(march.endPoint, minDist * 0.5);

  // find closest surface point, without this we get weird coloring artifacts
  let endPoint = march.endPoint.xyz - norm * march.headroom;
  var color = vec3f(0);

  var materialColor: vec3f;
  if (march.shape == ID_MARBLE) {
    materialColor = vec3f(0);
  } else {
    materialColor = saturate(
      col_fractal(vec4f(endPoint, 1)).xyz
    );
  }

  var k = 1.;

  // shadows
  let lightMarch = rayMarch(
    vec4f(endPoint + norm * EPSILON * 100., 1.), 
    LIGHT_DIRECTION, 
    SHADOW_SHARPNESS
  );
  k = lightMarch.minHeadroom * min(lightMarch.distance, 1.0);

  let reflected = dir - 2. * dot(dir, norm) * norm;
  var specular = max(dot(reflected, LIGHT_DIRECTION), 0.0);
  specular = pow(specular, SPECULAR_HIGHLIGHT);
  color += specular * LIGHT_COLOR * (k * SPECULAR_MULT);

  // diffuse lighting
  k = min(k, SHADOW_DARKNESS * 0.5 * (dot(norm, LIGHT_DIRECTION) - 1.) + 1.);

  k = max(k, 1.0 - SHADOW_DARKNESS);

  color += materialColor * LIGHT_COLOR * k;

  // let a = 1.0 / (1.0 + march.steps * AMBIENT_OCCLUSION_STRENGTH);
  // color += (1.0 - a) * AMBIENT_OCCLUSION_COLOR_DELTA;

  return saturate(color);
}

@fragment
fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
  let FOVperPixel = 1.0 / max(iResolution.x, 900.0);

  var uv = 2. * fragUV - 1.;
  uv.x *= iResolution.x / iResolution.y;

  var dir = (camera * normalize(vec4f(uv.x, uv.y, -FOCAL_DIST, 0.0))).xyz;
  var position = camera[3];

  let march = rayMarch(position, dir, 1.0);
  if (march.shape == ID_VOID) {
    // The ray did not hit the target
    var color = BACKGROUND_COLOR;

    let vignette = 1.0 - VIGNETTE_STRENGTH * length(fragUV * 0.5);
    color = vec4f(color.xyz * vignette, 1);
  
    // "spec" for specular
    var sunSpec = dot(dir, LIGHT_DIRECTION) - 1.0 + SUN_SIZE;
    sunSpec = min(exp(sunSpec * SUN_SHARPNESS / SUN_SIZE), 1.);
    color += vec4f(LIGHT_COLOR * sunSpec, 0);
  
    return color;
  } else if (march.shape == ID_MARBLE) {
    // Refract when entering the marble, and exiting
    let n = normalize(march.endPoint.xyz - iMarblePos);
    let q = refract(dir, n, 1.0 / 1.5);
    let exitPoint = march.endPoint.xyz + (dot(q, n) * 2.0 * iMarbleRad) * q;
    let exitN = normalize(exitPoint - iMarblePos);
    let exitQ = q;// (dot(q, dir) * 2.0) * q - dir;

    let exitStep = vec4f(exitPoint + exitN * EPSILON * 10.0, 1.0);
    let refrCol = fractalSurface(
      exitQ,
      rayMarch(exitStep, exitQ, 1.0)
    );

    return vec4f(refrCol, 1);
  } else {
    return vec4f(fractalSurface(dir, march), 1);
  }
}
    
    `;

  return (
    <>
      <RenderPipeline
        label="Test Shader"
        code={MyTestShaderCode}
        vertexMain="vertex_main"
        fragmentMain="fragment_main"
        draw={4}
      />
      <BufferBinding
        label="camera"
        group={0}
        id={0}
        value={props.store.cameraMatrix}
      />
      <VectorBinding label="iResolution" group={0} id={1} value={[640, 480]} />
      <ScalarBinding
        label="iFracScale"
        group={1}
        id={0}
        value={props.store.level.scale}
      />
      <ScalarBinding
        label="iFracAng1"
        group={1}
        id={1}
        value={props.store.level.angle1}
      />
      <ScalarBinding
        label="iFracAng2"
        group={1}
        id={2}
        value={props.store.level.angle2}
      />
      <VectorBinding
        label="iFracShift"
        group={1}
        id={3}
        value={xyzArray(props.store.level.offset)}
      />
      <VectorBinding
        label="iFracCol"
        group={1}
        id={4}
        value={rgbArray(props.store.level.color)}
      />
      <ScalarBinding
        label="iMarbleRad"
        group={1}
        id={5}
        value={props.store.level.marbleRadius}
      />
      <VectorBinding
        label="iMarblePos"
        group={2}
        id={0}
        value={xyzArray(props.store.level.marblePosition)}
      />
    </>
  );
}
