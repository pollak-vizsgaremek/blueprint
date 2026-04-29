"use client";

import { NAVIGATION_START, getClassroomLabel } from "@/lib/classrooms";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

type Node = { floor: number; row: number; col: number };
type FloorDef = { rows: number; cols: number; cells: string[][] };

const STAIR = "LEPCSO";
const PASSABLE_ROOM_PRESETS = new Set(["Info I", "Jatek"]);

const FLOORS: Record<number, FloorDef> = {
  0: {
    rows: 13,
    cols: 20,
    cells: [
      ["X", "X", "HAjto", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "IpElek", "", "X", "X", "KNX", "X", "X", "PLC", "X", "X", "X", "X", "X", "X", "DKA", "X", "X", "Mech", "X"],
      ["X", "X", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Kondi"],
      ["", "", "", "X", "FerfiO", "X", "X", "FwcT", "X", "X", "NoiO", "X", "X", "X", "Szert.", "X", "Torna T.", "X", "X", "X"],
      ["Elektr", "X", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "X", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["KAjto", "", "", "UAjto", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "X", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "Chill", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "SzerT", "NoiM", "X"],
      ["X", "Bufe", "", "", "", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "I. Tant.", "", "", "HBej"],
      ["X", "X", "", "", "X", "", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "", "", "X"],
      ["Jatek", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", STAIR],
      ["", "Fwc0", STAIR, "FoBej", "X", "X", "X", "Mat2", "X", "Mat3", "X", "X", "X", "X", "CadC", "X", "X", "X", "Info VI", "X"],
    ],
  },
  1: {
    rows: 6,
    cols: 20,
    cells: [
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "Info II", "", "X"],
      ["Igazg.", "Titk", "Tanari", "X", "X", "Info III", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "Info I", "X"],
      ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", STAIR],
      ["X", "Fwc1", STAIR, "Gaz.ir", "V. Tant.", "X", "Kajtor", "X", "X", "X", "Info VII", "X", "X", "X", "Info V", "X", "X", "X", "Info IV", "X"],
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
    ],
  },
  2: {
    rows: 6,
    cols: 20,
    cells: [
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["Jatek", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", STAIR],
      ["Nwc2", "Fwc2", STAIR, "X", "X", "Mat1", "X", "VII. Tant.", "X", "X", "VIII. Tant.", "X", "X", "X", "IX. Tant.", "X", "X", "X", "X. Tant.", "X"],
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
      ["X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X", "X"],
    ],
  },
};

const STAIR_CONNECTIONS: Record<string, Node> = {
  "0-12-2": { floor: 1, row: 4, col: 2 },
  "0-11-19": { floor: 1, row: 3, col: 19 },
  "1-4-2": { floor: 2, row: 4, col: 2 },
  "1-3-19": { floor: 2, row: 2, col: 19 },
  "2-3-2": { floor: 1, row: 4, col: 2 },
  "2-2-19": { floor: 1, row: 3, col: 19 },
};

const keyOf = (n: Node) => `${n.floor}-${n.row}-${n.col}`;

const normalizeName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

const DISPLAY_NAME_TO_CELL: Record<string, string> = {
  fobej: "FoBej",
  "fo bej": "FoBej",
  jatek: "Jatek",
  bufe: "Bufe",
  ferfio: "FerfiO",
  noio: "NoiO",
};

const resolveNameToCell = (value: string) => {
  const normalized = normalizeName(value);
  const mapped = DISPLAY_NAME_TO_CELL[normalized] ?? value;

  if (ROOM_INDEX[mapped]) return mapped;

  const exact = Object.keys(ROOM_INDEX).find(
    (key) => normalizeName(key) === normalized,
  );
  if (exact) return exact;

  const fuzzy = Object.keys(ROOM_INDEX).find((key) => {
    const keyNorm = normalizeName(key);
    return keyNorm.includes(normalized) || normalized.includes(keyNorm);
  });

  return fuzzy ?? mapped;
};

const buildRoomIndex = () => {
  const index: Record<string, Node> = {};
  Object.entries(FLOORS).forEach(([floorValue, floorData]) => {
    const floor = Number(floorValue);
    for (let row = 0; row < floorData.rows; row += 1) {
      for (let col = 0; col < floorData.cols; col += 1) {
        const value = floorData.cells[row][col];
        if (value && value !== "X" && value !== STAIR) {
          index[value] = { floor, row, col };
        }
      }
    }
  });
  return index;
};

const ROOM_INDEX = buildRoomIndex();

const isBlocked = (
  floor: number,
  row: number,
  col: number,
  startName: string,
  endName: string,
) => {
  const value = FLOORS[floor].cells[row][col] ?? "";
  if (value === "X") return true;
  if (value === STAIR) return false;
  if (value === "") return false;
  if (PASSABLE_ROOM_PRESETS.has(value)) return false;
  if (value === startName || value === endName) return false;
  return true;
};

const neighbors = (node: Node, startName: string, endName: string): Node[] => {
  const options: Node[] = [];
  const floorData = FLOORS[node.floor];
  const startPos = ROOM_INDEX[startName];
  const endPos = ROOM_INDEX[endName];
  if (!startPos || !endPos) return options;
  const sameFloor = startPos.floor === endPos.floor;

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  dirs.forEach(([dr, dc]) => {
    const row = node.row + dr;
    const col = node.col + dc;
    if (row < 0 || col < 0 || row >= floorData.rows || col >= floorData.cols) {
      return;
    }

    const value = floorData.cells[row][col] ?? "";
    if (sameFloor && value === STAIR) return;

    if (!isBlocked(node.floor, row, col, startName, endName)) {
      options.push({ floor: node.floor, row, col });
    }
  });

  const currentKey = keyOf(node);
  if (STAIR_CONNECTIONS[currentKey]) {
    options.push(STAIR_CONNECTIONS[currentKey]);
  }

  if (!sameFloor) {
    Object.entries(STAIR_CONNECTIONS).forEach(([key, target]) => {
      if (
        target.floor === node.floor &&
        target.row === node.row &&
        target.col === node.col
      ) {
        const [floor, row, col] = key.split("-").map(Number);
        options.push({ floor, row, col });
      }
    });
  }

  return options;
};

const heuristic = (a: Node, b: Node) => {
  if (STAIR_CONNECTIONS[keyOf(a)]) {
    return Math.abs(a.floor - b.floor);
  }
  return (
    Math.abs(a.row - b.row) +
    Math.abs(a.col - b.col) +
    Math.abs(a.floor - b.floor) * 10
  );
};

const findPath = (
  start: Node,
  end: Node,
  startName: string,
  endName: string,
) => {
  const open: Node[] = [start];
  const closed = new Set<string>();
  const came: Record<string, Node | undefined> = {};
  const gScore: Record<string, number> = { [keyOf(start)]: 0 };
  const fScore: Record<string, number> = {
    [keyOf(start)]: heuristic(start, end),
  };

  while (open.length > 0) {
    open.sort(
      (a, b) => (fScore[keyOf(a)] ?? Infinity) - (fScore[keyOf(b)] ?? Infinity),
    );
    const current = open.shift()!;
    const currentKey = keyOf(current);
    if (currentKey === keyOf(end)) {
      const path: Node[] = [current];
      let cursor: Node | undefined = came[currentKey];
      while (cursor) {
        path.push(cursor);
        cursor = came[keyOf(cursor)];
      }
      return path.reverse();
    }
    closed.add(currentKey);

    neighbors(current, startName, endName).forEach((next) => {
      const nextKey = keyOf(next);
      if (closed.has(nextKey)) return;
      const tentative = (gScore[currentKey] ?? Infinity) + 1;
      if (tentative < (gScore[nextKey] ?? Infinity)) {
        came[nextKey] = current;
        gScore[nextKey] = tentative;
        fScore[nextKey] = tentative + heuristic(next, end);
        if (!open.some((n) => keyOf(n) === nextKey)) open.push(next);
      }
    });
  }

  return [] as Node[];
};

const toDisplay = (value: string) => {
  switch (value) {
    case "FoBej":
      return "FőBej";
    case "Jatek":
      return "Játék";
    case "Bufe":
      return "Büfé";
    case "FerfiO":
      return "FérfiÖ";
    case "NoiO":
      return "NőiÖ";
    default:
      return value;
  }
};

const toSidebarDisplay = (value: string) => {
  const normalized = normalizeName(value);
  if (
    normalized === normalizeName(NAVIGATION_START) ||
    normalized === "fobej"
  ) {
    return "Főbejárat";
  }
  return getClassroomLabel(value);
};

export const EventNavigationMap = ({ classroom }: { classroom: string }) => {
  const [currentFloor, setCurrentFloor] = useState(0);
  const startName = resolveNameToCell(NAVIGATION_START);
  const endName = resolveNameToCell(classroom);
  const start = ROOM_INDEX[startName];
  const end = ROOM_INDEX[endName];

  const path = useMemo(() => {
    if (!start || !end) return [];
    return findPath(start, end, startName, endName);
  }, [start, end, startName, endName]);

  const pathOnFloor = useMemo(
    () =>
      new Set(
        path
          .filter((n) => n.floor === currentFloor)
          .map((n) => `${n.row}-${n.col}`),
      ),
    [path, currentFloor],
  );

  if (!start || !end) {
    return (
      <div className="rounded-xl border border-dashed border-faded/30 bg-secondary/30 p-4 text-faded">
        Nincs elérhető navigáció ehhez a tanteremhez: {classroom}
      </div>
    );
  }

  const floorData = FLOORS[currentFloor];
  const floorLabel =
    currentFloor === 0 ? "Földszint" : `${currentFloor}. emelet`;

  return (
    <div className="">
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-4">
        <aside className="rounded-xl border border-faded/20 bg-white p-3">
          <div className="text-xs font-semibold uppercase tracking-wider ">
            Navigáció
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-lg border border-accent/20 bg-[#f6fcff] p-2.5">
              <div className="text-xs text-faded">Kezdőpont</div>
              <div className="font-semibold text-text">
                {toSidebarDisplay(NAVIGATION_START)}
              </div>
            </div>
            <div className="rounded-lg border border-accent/40 bg-gradient-to-r from-accent/10 to-accent/5 p-2.5">
              <div className="text-xs text-accent">Célállomás</div>
              <div className="font-semibold text-text">
                {toSidebarDisplay(classroom)}
              </div>
              <div className="mt-1 text-xs text-faded">
                {end.floor === 0 ? "Földszint" : `${end.floor}. emelet`}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-faded sm:grid-cols-4 lg:grid-cols-2">
            <div className="inline-flex items-center gap-1 rounded border border-accent/20 bg-[#f6fcff] px-2 py-1">
              <span className="h-2 w-2 rounded-sm bg-[#00a676]" /> Start
            </div>
            <div className="inline-flex items-center gap-1 rounded border border-accent/20 bg-[#f6fcff] px-2 py-1">
              <span className="h-2 w-2 rounded-sm bg-[#ff5a5f]" /> Cél
            </div>
            <div className="inline-flex items-center gap-1 rounded border border-accent/20 bg-[#f6fcff] px-2 py-1">
              <span className="h-2 w-2 rounded-sm bg-sky-500" /> Útvonal
            </div>
            <div className="inline-flex items-center gap-1 rounded border border-accent/20 bg-[#f6fcff] px-2 py-1">
              <span className="h-2 w-2 rounded-sm bg-[#ffbf47]" /> Lépcső
            </div>
          </div>
        </aside>

        <div className="rounded-xl border border-faded/20 bg-white p-2.5 sm:p-3">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-text">
              Aktuális szint: {floorLabel}
            </div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-accent/25 bg-[#f6fcff] px-2 py-1">
              <button
                type="button"
                onClick={() =>
                  setCurrentFloor((value) => Math.max(0, value - 1))
                }
                className="rounded p-1 text-accent transition hover:bg-accent/15"
                aria-label="Lépés lejjebb"
              >
                <ChevronDown size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentFloor((value) => Math.min(2, value + 1))
                }
                className="rounded p-1 text-accent transition hover:bg-accent/15"
                aria-label="Lépés feljebb"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          </div>

          <div className="w-full rounded-lg border-faded/20 border p-2 shadow-inner">
            <div
              className="grid w-full gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${floorData.cols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: floorData.rows * floorData.cols }).map(
                (_, index) => {
                  const row = Math.floor(index / floorData.cols);
                  const col = index % floorData.cols;
                  const value = floorData.cells[row][col] ?? "";
                  const isWall = value === "X";
                  const isStair = value === STAIR;
                  const pointKey = `${row}-${col}`;
                  const isPath = pathOnFloor.has(pointKey);
                  const isStart =
                    currentFloor === start.floor &&
                    row === start.row &&
                    col === start.col;
                  const isEnd =
                    currentFloor === end.floor &&
                    row === end.row &&
                    col === end.col;
                  const label = isWall ? "" : isStair ? "L" : value;

                  return (
                    <div
                      key={`${currentFloor}-${row}-${col}`}
                      className={`relative flex h-8 items-center justify-center overflow-hidden rounded-[2px] border px-0.5 text-center text-[9px] leading-tight sm:h-9 sm:text-[10px] ${
                        isWall
                          ? "border-[#f4f4f4] bg-[#fdfdfd]"
                          : isStart
                            ? "border-[#00885f] bg-[#00a676] text-white"
                            : isEnd
                              ? "border-[#e2474d] bg-[#ff5a5f] text-white"
                              : isPath
                                ? "border-[#0f87b2] bg-accent text-white"
                                : isStair
                                  ? "border-[#dc9f35] bg-[#ffbf47] text-[#1f2937]"
                                  : label
                                    ? "border-accent/25 bg-white text-text"
                                    : "border-accent/20 bg-[#f0f0f0]"
                      }`}
                    >
                      {label ? (
                        <span
                          className="pointer-events-none block max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium"
                          title={toDisplay(label)}
                        >
                          {toDisplay(label)}
                        </span>
                      ) : null}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
