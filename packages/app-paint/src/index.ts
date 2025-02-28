import { ensureAttributes } from "@netless/app-shared";
import type { NetlessApp } from "@netless/window-manager";
import { SideEffectManager } from "side-effect-manager";
import type { Event } from "white-web-sdk";
import FitCurve from "./fit-curve-worker?worker";
import type { Path } from "./paper";
import Paper from "./paper";
import type { BroadcastEvent, Curve, PID, Point } from "./typings";

export interface Attributes {
  curves: Record<PID, Curve[]>;
}

const Paint: NetlessApp<Attributes> = {
  kind: "Paint",
  setup(context) {
    const { appId } = context;
    const box = context.getBox();
    const room = context.getRoom();
    const displayer = context.getDisplayer();
    const attrs = ensureAttributes(context, {
      curves: {},
    });

    const svg = Paper.createSVGElement();
    svg.setAttribute("fill", "transparent");
    svg.setAttribute("stroke", "#000");
    svg.setAttribute("stroke-width", "2");
    Object.assign(svg.style, {
      display: "block",
      width: "100%",
      height: "100%",
    });
    box.mountContent(svg as unknown as HTMLElement);
    box.$content?.addEventListener("touchstart", e => e.preventDefault());
    box.$content?.addEventListener("touchmove", e => e.preventDefault());

    const sideEffectManager = new SideEffectManager();
    const fitCurve = new FitCurve();

    const channel = `channel-${appId}`;

    const broadcast = (payload: BroadcastEvent) => {
      if (context.getIsWritable()) {
        room?.dispatchMagixEvent(channel, payload);
      }
    };

    type PathInfo = {
      points: Point[];
      path: Path;
      timeStamp?: number;
    };

    const paths: Record<PID, PathInfo> = {};

    const magixEventListener = (ev: Event) => {
      if (ev.event === channel && ev.authorId !== displayer.observerId) {
        const { clear, pid, point, done }: BroadcastEvent = ev.payload;
        if (clear) {
          paper.clear();
          paper.initCurves(attrs.curves);
        }
        if (pid) {
          let item = paths[pid];
          if (!item) {
            item = paths[pid] = { points: [], path: paper.newPath() };
          }
          if (point) {
            item.points.push(point);
            item.path.replace(item.points);
          }
          if (done) {
            delete paths[pid];
          }
        }
      }
    };

    sideEffectManager.add(() => {
      displayer.addMagixEventListener(channel, magixEventListener);
      return () => displayer?.removeMagixEventListener(channel);
    });

    const paper = new Paper(
      svg,
      // onDraw
      (pid: PID, point: Point, timeStamp: number) => {
        let item = paths[pid];
        if (!item) {
          item = paths[pid] = { points: [], path: paper.newPath() };
        }
        item.points.push(point);
        item.path.replace(item.points);
        item.timeStamp = timeStamp;

        broadcast({ pid, point });
      },
      // onDrawEnd
      (pid: PID) => {
        const item = paths[pid];
        if (!item) return;
        if (item.points.length < 2) {
          item.path.remove();
        } else {
          fitCurve.postMessage({ id: pid, path: item.points, error: 5 });
        }
        delete paths[pid];

        broadcast({ pid, done: true });
      }
    );

    paper.initCurves(attrs.curves);

    fitCurve.onmessage = (ev: MessageEvent<{ id: string; curves: ReadonlyArray<Curve> }>) => {
      const { id: pid, curves } = ev.data;
      if (context.getIsWritable()) {
        context.updateAttributes(["curves", pid], curves);
      }
    };

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "CLEAR ALL";
    clearBtn.addEventListener("click", () => {
      paper.clear();
      context.updateAttributes(["curves"], {});
      broadcast({ clear: true });
    });
    const wrapper = document.createElement("div");
    wrapper.append(clearBtn);
    Object.assign(wrapper.style, {
      display: "flex",
      justifyContent: "center",
    });
    box.mountFooter(wrapper);

    context.emitter.on("destroy", () => {
      console.log("[Paint]: destroy");
      sideEffectManager.flushAll();
      paper.destroy();
    });
  },
};

export default Paint;
