import type { PlaygroundConfigs } from "../playground/typings";
import HelloWorld from "./src";
import TwoRange from "./src/two-range";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const options: PlaygroundConfigs<any> = [
  {
    app: HelloWorld,
    options: { title: "Hello, world!" },
  },
  {
    app: TwoRange,
    options: { title: "2 range" },
  },
];

export default options;
