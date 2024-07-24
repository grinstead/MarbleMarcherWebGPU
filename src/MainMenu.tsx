import { createMemo, useContext } from "solid-js";
import { createSignal } from "solid-js";
import {
  FreeCamera,
  MarbleCamera,
  MarbleCameraProps,
  OrbitCamera,
} from "./Camera.tsx";
import { Fractal } from "./Fractal.tsx";
import { FractalShape, levels } from "./LevelData.ts";
import { HideMarble } from "./Marble.tsx";
import { IDENTITY } from "./Matrix.ts";
import { OverlayMenu } from "./OverlayMenu.tsx";
import { Countdown } from "./Countdown.tsx";
import { Timer } from "./Timer.tsx";
import {
  addVec,
  GameLoopContext,
  Props,
  rgb,
  scale,
  useTime,
  vec,
} from "@grinstead/ambush";

export function MainMenu() {
  const { timer } = useContext(GameLoopContext)!;
  const [menuOption, setMenuOption] = createSignal<string | null>(null);
  const [showTimer, setShowTimer] = createSignal(false); 

  const time = useTime(() => timer.subtimer());

  const shape = createMemo<FractalShape>(() => {
    // set time to a theoretical frame to match original marble marcher
    const t = time() * 60;

    return {
      scale: 1.6,
      angle1: 2 + 0.5 * Math.cos(t * 0.0021),
      angle2: Math.PI + 0.5 * Math.cos(t * 0.000287),
      offset: vec(
        -4 + 0.5 * Math.sin(t * 0.00161),
        -1 + 0.2 * Math.sin(t * 0.00123),
        -1 + 0.1 * Math.cos(t * 0.00137)
      ),
    };
  });

  const camera = createMemo<Props<typeof OrbitCamera>>(() => {
    // constants copied from marble marcher
    const dist = 10;
    const orbitPos = vec(0, 3, 0);
    const theta = 0.12 * time() - 2;
    const perp = vec(Math.sin(theta), 0, Math.cos(theta));

    const camPos = addVec(orbitPos, scale(perp, dist));

    const lookX = Math.atan2(perp.x, perp.z) + 0.5;
    const lookY = -0.41;

    return {
      target: camPos,
      offset: vec(lookX, lookY),
    };
  });

  const handleMenuSelect = (option: string) => {
    setMenuOption(option);
  };

  const handleCountdownEnd = () => {
    setShowTimer(true); 
  };

  return (
    <>
      {menuOption() === null && 
        <>
          <OverlayMenu onSelect={handleMenuSelect} />
          <Fractal
            {...shape()}
            color={rgb(-0.2, -0.1, -0.6)}
            marbleRadius={1}
            isPlanet={false}
            flagPosition={vec(999, 999, 999)}
          />
          <HideMarble />
          <OrbitCamera {...camera()} />
        </>
      }
      {menuOption() === 'Play' && (
        <>
          {!showTimer() && <Countdown onCountdownEnd={handleCountdownEnd} />}
          {showTimer() && <Timer />}
          <Fractal
            {...shape()}
            color={rgb(-0.2, -0.1, -0.6)}
            marbleRadius={1}
            isPlanet={false}
            flagPosition={vec(999, 999, 999)}
          />
          <HideMarble />
          <OrbitCamera {...camera()} />
        </>
      )}
      {menuOption() === 'Levels' && <div>Levels Screen</div>}
      {menuOption() === 'Controls' && <div>Controls Screen</div>}
      {menuOption() === 'Screensaver' && <div>Screensaver Screen</div>}
    </>
  );
}

//
// "iFracScale": frac_params_smooth[0]);
// "iFracAng1": frac_params_smooth[1]);
// "iFracAng2": frac_params_smooth[2]);
// "iFracShift": sf::Glsl::Vec3(frac_params_smooth[3], frac_params_smooth[4], frac_params_smooth[5]));
// "iFracCol": sf::Glsl::Vec3(frac_params_smooth[6], frac_params_smooth[7], frac_params_smooth[8]));

// export type FractalShape = {
//   scale: number;
//   angle1: number;
//   angle2: number;
//   offset: Vec;
// };

// export type LevelData = FractalShape & {
//   color: RGB;
//   marbleRadius: number;
//   startLookDirection: number;
//   orbitDistance: number;
//   marblePosition: Vec;
//   flagPosition: Vec;
//   deathBarrier: number;
//   isPlanet: boolean;
//   title: string;
//   animation: Vec;
// };

// class Level {
//   public:
//     Level() {}
//     Level(float s, float a1, float a2,
//           const Eigen::Vector3f& v,
//           const Eigen::Vector3f& c,
//           float rad,
//           float look_x,
//           float orbit_d,
//           const Eigen::Vector3f& start,
//           const Eigen::Vector3f& end,
//           float kill,
//           bool planet,
//           const char* desc,
//           float an1=0.0f, float an2=0.0f, float an3=0.0f);

//     FractalParams params;      //Fractal parameters
//     float marble_rad;          //Radius of the marble
//     float start_look_x;        //Camera direction on start
//     float orbit_dist;          //Distance to orbit
//     Eigen::Vector3f start_pos; //Starting position of the marble
//     Eigen::Vector3f end_pos;   //Ending goal flag position
//     float kill_y;              //Below this height player is killed
//     bool planet;               //True if gravity should be like a planet
//     const char* txt;           //Description displayed before level
//     float anim_1;              //Animation amount for angle1 parameter
//     float anim_2;              //Animation amount for angle2 parameter
//     float anim_3;              //Animation amount for offset_y parameter
//   };
