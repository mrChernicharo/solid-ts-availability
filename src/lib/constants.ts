import { IStore, IWeekday } from "./types";
// @ts-ignore
import idMaker from "@melodev/id-maker";

export const THEME = {
  dark: {
    primary: "royalblue",
    primary2: "dodgerblue",
    accent: "fuchsia",
    accent2: "hotpink",
    text: "#fff",
    text2: "#ccc",
    lightText: "#444",
    bg: "#222",
    bg2: "#555",
  },
  light: {
    primary: "fuchsia",
    primary2: "hotpink",
    accent: "royalblue",
    accent2: "dodgerblue",
    text: "#222",
    text2: "#555",
    lightText: "#ddd",
    bg: "#fff",
    bg2: "#ccc",
  },
};

export const INITIAL_STORE: IStore = {
  day: null,
  slotId: null,
  lastWindowPos: { x: 0, y: 0 },
  lastContainerPos: { x: 0, y: 0 },
  gesture: "idle",
  Sun: [],
  Mon: [
    // {
    //   id: idMaker(),
    //   start: 0,
    //   end: 60,
    // },
  ],
  Tue: [],
  Wed: [
    // {
    //   id: idMaker(),
    //   start: 60,
    //   end: 180,
    // },
    // {
    //   id: idMaker(),
    //   start: 240,
    //   end: 300,
    // },
  ],
  Thu: [],
  Fri: [],
  Sat: [],
  modal: { create: false, merge: false, details: false, confirm: false, drop: false },
};

export const WEEKDAYS: IWeekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const SCROLL_BAR = 17;

export const MARKER_TIME = 400;
export const MODAL_WIDTH = 120;
export const MODAL_HEIGHT = 140;

export const SNAP_OPTIONS = [30, 20, 15, 10, 5];

export const DEFAULT_SLOT_DURATION = 30;
export const MIN_SLOT_DURATION = 15;

export const MODAL_TYPES = ["create", "merge", "details", "confirm", "drop"];
