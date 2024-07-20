/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import { Embedded } from "./Embedded.tsx";

const root = document.getElementById("root");

render(() => <Embedded />, root!);
