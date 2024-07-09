export function frag() {
  return `
@group(0) @binding(0) var<uniform> iMat: mat4x4<f32>;
@group(0) @binding(1) var<uniform> iResolution: vec2<f32>;
@group(0) @binding(2) var<uniform> iDebug: vec3<f32>;
@group(0) @binding(3) var<uniform> iFracScale: f32;
@group(0) @binding(4) var<uniform> iFracAng1: f32;
@group(0) @binding(5) var<uniform> iFracAng2: f32;
@group(0) @binding(6) var<uniform> iFracShift: vec3<f32>;
@group(0) @binding(7) var<uniform> iFracCol: vec3<f32>;
@group(0) @binding(8) var<uniform> iMarblePos: vec3<f32>;
@group(0) @binding(9) var<uniform> iMarbleRad: f32;
@group(0) @binding(10) var<uniform> iFlagScale: f32;
@group(0) @binding(11) var<uniform> iFlagPos: vec3<f32>;
@group(0) @binding(12) var<uniform> iExposure: f32;
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

const AMBIENT_OCCLUSION_COLOR_DELTA: vec3<f32> = vec3<f32>(0.7, 0.7, 0.7);
const AMBIENT_OCCLUSION_STRENGTH: f32 = 0.008;
const ANTIALIASING_SAMPLES: u32 = 1;
const BACKGROUND_COLOR: vec3<f32> = vec3<f32>(0.6, 0.8, 1.0);
const DIFFUSE_ENABLED: u32 = 0;
const DIFFUSE_ENHANCED_ENABLED: u32 = 1;
const FILTERING_ENABLE: u32 = 0;
const FOCAL_DIST: f32 = 1.73205080757;
const FOG_ENABLED: u32 = 0;
const FRACTAL_ITER: u32 = 16;
const LIGHT_COLOR: vec3<f32> = vec3<f32>(1.0, 0.95, 0.8);
const LIGHT_DIRECTION: vec3<f32> = vec3<f32>(-0.36, 0.8, 0.48);
const MAX_DIST: f32 = 30.0;
const MAX_MARCHES: u32 = 1000;
const MIN_DIST: f32 = 1e-5;
const PI: f32 = 3.14159265358979;
const SHADOWS_ENABLED: u32 = 1;
const SHADOW_DARKNESS: f32 = 0.7;
const SHADOW_SHARPNESS: f32 = 10.0;
const SPECULAR_HIGHLIGHT: u32 = 40;
const SPECULAR_MULT: f32 = 0.25;
const SUN_ENABLED: u32 = 1;
const SUN_SHARPNESS: f32 = 2.0;
const SUN_SIZE: f32 = 0.004;
const VIGNETTE_STRENGTH: f32 = 0.5;

var<private> FOVperPixel: f32;

fn refraction(rd: vec3<f32>, n: vec3<f32>, p: f32) -> vec3<f32> {
    let dot_nd = dot(rd, n);
    return p * (rd - dot_nd * n) + sqrt(1.0 - (p * p) * (1.0 - dot_nd * dot_nd)) * n;
}

fn planeFold(z: ptr<function, vec4<f32>>, n: vec3<f32>, d: f32) {
    (*z).xyz -= 2.0 * min(0.0, dot((*z).xyz, n) - d) * n;
}

fn sierpinskiFold(z: ptr<function, vec4<f32>>) {
    (*z).xy -= min((*z).x + (*z).y, 0.0);
    (*z).xz -= min((*z).x + (*z).z, 0.0);
    (*z).yz -= min((*z).y + (*z).z, 0.0);
}

fn mengerFold(z: ptr<function, vec4<f32>>) {
    var a = min((*z).x - (*z).y, 0.0);
    (*z).x -= a;
    (*z).y += a;
    a = min((*z).x - (*z).z, 0.0);
    (*z).x -= a;
    (*z).z += a;
    a = min((*z).y - (*z).z, 0.0);
    (*z).y -= a;
    (*z).z += a;
}

fn boxFold(z: ptr<function, vec4<f32>>, r: vec3<f32>) {
    (*z).xyz = clamp((*z).xyz, -r, r) * 2.0 - (*z).xyz;
}

fn rotX(z: ptr<function, vec4<f32>>, s: f32, c: f32) {
    (*z).yz = vec2<f32>(c * (*z).y + s * (*z).z, c * (*z).z - s * (*z).y);
}

fn rotY(z: ptr<function, vec4<f32>>, s: f32, c: f32) {
    (*z).xz = vec2<f32>(c * (*z).x - s * (*z).z, c * (*z).z + s * (*z).x);
}

fn rotZ(z: ptr<function, vec4<f32>>, s: f32, c: f32) {
    (*z).xy = vec2<f32>(c * (*z).x + s * (*z).y, c * (*z).y - s * (*z).x);
}

fn rotX(z: ptr<function, vec4<f32>>, a: f32) {
    rotX(z, sin(a), cos(a));
}

fn rotY(z: ptr<function, vec4<f32>>, a: f32) {
    rotY(z, sin(a), cos(a));
}

fn rotZ(z: ptr<function, vec4<f32>>, a: f32) {
    rotZ(z, sin(a), cos(a));
}

fn de_sphere(p: vec4<f32>, r: f32) -> f32 {
    return (length(p.xyz) - r) / p.w;
}

fn de_box(p: vec4<f32>, s: vec3<f32>) -> f32 {
    let a = abs(p.xyz) - s;
    return (min(max(max(a.x, a.y), a.z), 0.0) + length(max(a, 0.0))) / p.w;
}

fn de_tetrahedron(p: vec4<f32>, r: f32) -> f32 {
    let md = max(max(-p.x - p.y - p.z, p.x + p.y - p.z), max(-p.x + p.y + p.z, p.x - p.y + p.z));
    return (md - r) / (p.w * sqrt(3.0));
}

fn de_capsule(p: vec4<f32>, h: f32, r: f32) -> f32 {
    let py = p.y - clamp(p.y, -h, h);
    return (length(vec3<f32>(p.x, py, p.z)) - r) / p.w;
}

fn de_fractal(p: vec4<f32>) -> f32 {
    for (var i: u32 = 0; i < FRACTAL_ITER; i = i + 1) {
        p.xyz = abs(p.xyz);
        rotZ(&p, uniforms.iFracAng1);
        mengerFold(&p);
        rotX(&p, uniforms.iFracAng2);
        p *= uniforms.iFracScale;
        p.xyz += uniforms.iFracShift;
    }
    return de_box(p, vec3<f32>(6.0, 6.0, 6.0));
}

fn col_fractal(p: vec4<f32>) -> vec4<f32> {
    var orbit = vec3<f32>(0.0, 0.0, 0.0);
    for (var i: u32 = 0; i < FRACTAL_ITER; i = i + 1) {
        p.xyz = abs(p.xyz);
        rotZ(&p, uniforms.iFracAng1);
        mengerFold(&p);
        rotX(&p, uniforms.iFracAng2);
        p *= uniforms.iFracScale;
        p.xyz += uniforms.iFracShift;
        orbit = max(orbit, p.xyz * uniforms.iFracCol);
    }
    return vec4<f32>(orbit, de_box(p, vec3<f32>(6.0, 6.0, 6.0)));
}

fn de_marble(p: vec4<f32>) -> f32 {
    return de_sphere(p - vec4<f32>(uniforms.iMarblePos, 0.0), uniforms.iMarbleRad);
}

fn col_marble(p: vec4<f32>) -> vec4<f32> {
    return vec4<f32>(0.0, 0.0, 0.0, de_sphere(p - vec4<f32>(uniforms.iMarblePos, 0.0), uniforms.iMarbleRad));
}

fn de_flag(p: vec4<f32>) -> f32 {
    let f_pos = uniforms.iFlagPos + vec3<f32>(1.5, 4.0, 0.0) * uniforms.iFlagScale;
    var d = de_box(p - vec4<f32>(f_pos, 0.0), vec3<f32>(1.5, 0.8, 0.08) * uniforms.iMarbleRad);
    d = min(d, de_capsule(p - vec4<f32>(uniforms.iFlagPos + vec3<f32>(0.0, uniforms.iFlagScale * 2.4, 0.0), 0.0), uniforms.iMarbleRad * 2.4, uniforms.iMarbleRad * 0.18));
    return d;
}

fn col_flag(p: vec4<f32>) -> vec4<f32> {
    let f_pos = uniforms.iFlagPos + vec3<f32>(1.5, 4.0, 0.0) * uniforms.iFlagScale;
    let d1 = de_box(p - vec4<f32>(f_pos, 0.0), vec3<f32>(1.5, 0.8, 0.08) * uniforms.iMarbleRad);
    let d2 = de_capsule(p - vec4<f32>(uniforms.iFlagPos + vec3<f32>(0.0, uniforms.iFlagScale * 2.4, 0.0), 0.0), uniforms.iMarbleRad * 2.4, uniforms.iMarbleRad * 0.18);
    if (d1 < d2) {
        return vec4<f32>(1.0, 0.2, 0.1, d1);
    } else {
        return vec4<f32>(0.9, 0.9, 0.1, d2);
    }
}

fn de_scene(p: vec4<f32>) -> f32 {
    var d = de_fractal(p);
    d = min(d, de_marble(p));
    d = min(d, de_flag(p));
    return d;
}

fn col_scene(p: vec4<f32>) -> vec4<f32> {
    var col = col_fractal(p);
    let col_f = col_flag(p);
    if (col_f.w < col.w) { col = col_f; }
    let col_m = col_marble(p);
    if (col_m.w < col.w) {
        return vec4<f32>(col_m.xyz, 1.0);
    }
    return vec4<f32>(col.xyz, 0.0);
}

fn calcNormal(p: vec4<f32>, dx: f32) -> vec3<f32> {
    const k: vec3<f32> = vec3<f32>(1.0, -1.0, 0.0);
    return normalize(
        k.xyy * de_scene(p + vec4<f32>(k.xyy, dx)) +
        k.yyx * de_scene(p + vec4<f32>(k.yyx, dx)) +
        k.yxy * de_scene(p + vec4<f32>(k.yxy, dx)) +
        k.xxx * de_scene(p + vec4<f32>(k.xxx, dx))
    );
}

fn smoothColor(p: vec4<f32>, s1: vec3<f32>, s2: vec3<f32>, dx: f32) -> vec4<f32> {
    return (col_scene(p + vec4<f32>(s1, 0.0) * dx) +
            col_scene(p - vec4<f32>(s1, 0.0) * dx) +
            col_scene(p + vec4<f32>(s2, 0.0) * dx) +
            col_scene(p - vec4<f32>(s2, 0.0) * dx)) / 4.0;
}

fn ray_march(p: ptr<function, vec4<f32>>, ray: vec4<f32>, sharpness: f32) -> vec4<f32> {
    var d = de_scene(*p);
    if (d < 0.0 && sharpness == 1.0) {
        var v: vec3<f32>;
        if (abs(uniforms.iMarblePos.x) >= 999.0) {
            v = (-20.0 * uniforms.iMarbleRad) * uniforms.iMat[2].xyz;
        } else {
            v = uniforms.iMarblePos.xyz - uniforms.iMat[3].xyz;
        }
        d = dot(v, v) / dot(v, ray.xyz) - uniforms.iMarbleRad;
    }
    var s = 0.0;
    var td = 0.0;
    var min_d = 1.0;
    for (; s < f32(MAX_MARCHES); s = s + 1.0) {
        let min_dist = max(FOVperPixel * td, MIN_DIST);
        if (d < min_dist) {
            s = s + d / min_dist;
            break;
        } else if (td > MAX_DIST) {
            break;
        }
        td = td + d;
        *p = *p + ray * d;
        min_d = min(min_d, sharpness * d / td);
        d = de_scene(*p);
    }
    return vec4<f32>(d, s, td, min_d);
}

fn scene(p: ptr<function, vec4<f32>>, ray: ptr<function, vec4<f32>>, vignette: f32) -> vec4<f32> {
    let d_s_td_m = ray_march(p, *ray, 1.0);
    let d = d_s_td_m.x;
    let s = d_s_td_m.y;
    let td = d_s_td_m.z;

    var col = vec4<f32>(0.0, 0.0, 0.0, 0.0);
    let min_dist = max(FOVperPixel * td, MIN_DIST);
    if (d < min_dist) {
        let n = calcNormal(*p, min_dist * 0.5);
        (*p).xyz -= n * d;

        #if FILTERING_ENABLE
            let s1 = normalize(cross(ray.xyz, n));
            let s2 = cross(s1, n);
            let orig_col = clamp(smoothColor(*p, s1, s2, min_dist * 0.5), 0.0, 1.0);
        #else
            let orig_col = clamp(col_scene(*p), 0.0, 1.0);
        #endif
        col.w = orig_col.w;

        var k = 1.0;
        #if SHADOWS_ENABLED
            var light_pt = *p;
            light_pt.xyz += n * MIN_DIST * 100.0;
            let rm = ray_march(&light_pt, vec4<f32>(LIGHT_DIRECTION, 0.0), SHADOW_SHARPNESS);
            k = rm.w * min(rm.z, 1.0);
        #endif

        #if SPECULAR_HIGHLIGHT > 0
            let reflected = ray.xyz - 2.0 * dot(ray.xyz, n) * n;
            var specular = max(dot(reflected, LIGHT_DIRECTION), 0.0);
            specular = pow(specular, f32(SPECULAR_HIGHLIGHT));
            col.xyz += specular * LIGHT_COLOR * (k * SPECULAR_MULT);
        #endif

        #if DIFFUSE_ENHANCED_ENABLED
            k = min(k, SHADOW_DARKNESS * 0.5 * (dot(n, LIGHT_DIRECTION) - 1.0) + 1.0);
        #elif DIFFUSE_ENABLED
            k = min(k, dot(n, LIGHT_DIRECTION));
        #endif

        k = max(k, 1.0 - SHADOW_DARKNESS);
        col.xyz += orig_col.xyz * LIGHT_COLOR * k;

        let a = 1.0 / (1.0 + s * AMBIENT_OCCLUSION_STRENGTH);
        col.xyz += (1.0 - a) * AMBIENT_OCCLUSION_COLOR_DELTA;

        #if FOG_ENABLED
            let a = td / MAX_DIST;
            col.xyz = (1.0 - a) * col.xyz + a * BACKGROUND_COLOR;
        #endif

        *ray = vec4<f32>(n, 0.0);
    } else {
        col.xyz += BACKGROUND_COLOR;
        col.xyz *= vignette;
        #if SUN_ENABLED
            let sun_spec = dot(ray.xyz, LIGHT_DIRECTION) - 1.0 + SUN_SIZE;
            sun_spec = min(exp(sun_spec * SUN_SHARPNESS / SUN_SIZE), 1.0);
            col.xyz += LIGHT_COLOR * sun_spec;
        #endif
    }

    return col;
}

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    FOVperPixel = 1.0 / max(uniforms.iResolution.x, 900.0);

    var col = vec3<f32>(0.0, 0.0, 0.0);
    for (var i: u32 = 0; i < ANTIALIASING_SAMPLES; i = i + 1) {
        for (var j: u32 = 0; j < ANTIALIASING_SAMPLES; j = j + 1) {
            let delta = vec2<f32>(f32(i), f32(j)) / f32(ANTIALIASING_SAMPLES);
            let screen_pos = (fragCoord.xy + delta) / uniforms.iResolution.xy;

            var uv = 2.0 * screen_pos - 1.0;
            uv.x *= uniforms.iResolution.x / uniforms.iResolution.y;

            var ray = uniforms.iMat * normalize(vec4<f32>(uv.x, uv.y, -FOCAL_DIST, 0.0));
            var p = uniforms.iMat[3];

            let vignette = 1.0 - VIGNETTE_STRENGTH * length(screen_pos - 0.5);
            let r = ray.xyz;
            let col_r = scene(&p, &ray, vignette);

            if (col_r.w > 0.5) {
                let n = normalize(uniforms.iMarblePos - p.xyz);
                let q = refraction(r, n, 1.0 / 1.5);
                let p2 = p.xyz + (dot(q, n) * 2.0 * uniforms.iMarbleRad) * q;
                let n2 = normalize(p2 - uniforms.iMarblePos);
                let q2 = (dot(q, r) * 2.0) * q - r;
                var p_temp = vec4<f32>(p2 + n2 * (MIN_DIST * 10.0), 1.0);
                var r_temp = vec4<f32>(q2, 0.0);
                let refr = scene(&p_temp, &r_temp, 0.8).xyz;

                let n3 = normalize(p.xyz - uniforms.iMarblePos);
                let q3 = r - n3 * (2.0 * dot(r, n3));
                p_temp = vec4<f32>(p.xyz + n3 * (MIN_DIST * 10.0), 1.0);
                r_temp = vec4<f32>(q3, 0.0);
                let refl = scene(&p_temp, &r_temp, 0.8).xyz;

                col += refr * 0.6 + refl * 0.4 + col_r.xyz;
            } else {
                col += col_r.xyz;
            }
        }
    }

    col *= uniforms.iExposure / (f32(ANTIALIASING_SAMPLES) * f32(ANTIALIASING_SAMPLES));
    return vec4<f32>(clamp(col, vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0)), 1.0);
}

`;
}
