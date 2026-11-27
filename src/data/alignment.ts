import { BOARD_HEIGHT, BOARD_WIDTH, itemHeight } from "./freeBoard";
import type { FreeItem } from "./model";

type Axis = "x" | "y";
type Bounds = { x: number; y: number; width: number; height: number };
type Target = { position: number; bounds: Bounds; page: boolean };
type Targets = Record<Axis, Target[]>;
export type AlignmentGuide = {
  axis: Axis;
  position: number;
  from: number;
  to: number;
};

const size = { x: "width", y: "height" } as const;
const page = { x: 0, y: 0, width: BOARD_WIDTH, height: BOARD_HEIGHT };

function visualBounds(item: FreeItem): Bounds {
  const height = itemHeight(item);
  const angle = (item.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const width = item.width * cos + height * sin;
  const rotatedHeight = item.width * sin + height * cos;
  return {
    x: item.x + (item.width - width) / 2,
    y: item.y + (height - rotatedHeight) / 2,
    width,
    height: rotatedHeight,
  };
}

function anchors(bounds: Bounds, axis: Axis) {
  const span = bounds[size[axis]];
  return [bounds[axis], bounds[axis] + span / 2, bounds[axis] + span];
}

export function alignmentTargets(items: FreeItem[], movingId: string): Targets {
  const targets: Targets = { x: [], y: [] };
  const add = (bounds: Bounds, isPage: boolean) => {
    for (const axis of ["x", "y"] as const) {
      for (const position of anchors(bounds, axis)) {
        if (position >= 0 && position <= page[size[axis]])
          targets[axis].push({ position, bounds, page: isPage });
      }
    }
  };
  // Page references take precedence when two matches are equally close.
  add(page, true);
  for (const item of items)
    if (item.id !== movingId) add(visualBounds(item), false);
  return targets;
}

function nearestMatch(
  item: FreeItem,
  bounds: Bounds,
  axis: Axis,
  targets: Target[],
  tolerance: number,
  span: number,
) {
  const limit = Math.max(0, page[size[axis]] - span);
  let match: { target: Target; delta: number } | undefined;
  for (const anchor of anchors(bounds, axis)) {
    for (const target of targets) {
      const delta = target.position - anchor;
      const next = item[axis] + delta;
      if (Math.abs(delta) > tolerance || next < 0 || next > limit) continue;
      if (
        !match ||
        Math.abs(delta) < Math.abs(match.delta) ||
        (Math.abs(delta) === Math.abs(match.delta) &&
          target.page &&
          !match.target.page)
      ) {
        match = { target, delta };
      }
    }
  }
  return match;
}

export function alignDraggedItem(
  item: FreeItem,
  targets: Targets,
  tolerance: Record<Axis, number>,
) {
  const bounds = visualBounds(item);
  const x = nearestMatch(item, bounds, "x", targets.x, tolerance.x, item.width);
  const y = nearestMatch(
    item,
    bounds,
    "y",
    targets.y,
    tolerance.y,
    itemHeight(item),
  );
  const dx = x?.delta ?? 0;
  const dy = y?.delta ?? 0;
  const shifted = { ...bounds, x: bounds.x + dx, y: bounds.y + dy };
  const guides: AlignmentGuide[] = [];
  for (const [axis, match] of [
    ["x", x],
    ["y", y],
  ] as const) {
    if (!match) continue;
    const other = axis === "x" ? "y" : "x";
    const { target } = match;
    const from = target.page
      ? 0
      : Math.max(0, Math.min(shifted[other], target.bounds[other]));
    const to = target.page
      ? page[size[other]]
      : Math.min(
          page[size[other]],
          Math.max(
            shifted[other] + shifted[size[other]],
            target.bounds[other] + target.bounds[size[other]],
          ),
        );
    guides.push({ axis, position: target.position, from, to });
  }
  return { item: { ...item, x: item.x + dx, y: item.y + dy }, guides };
}
