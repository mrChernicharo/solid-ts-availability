export type IWeekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type IGesture = "idle" | "drag:middle" | "drag:top" | "drag:bottom";
export type IPalette = "light" | "dark";
export type ISnapOption = 30 | 20 | 15 | 10 | 5;
export type IStore = {
  day: IWeekday | null;
  slotId: string | null;
  slotIdx: number | null;
  lastClickPos: { x: number; y: number };
  lastContainerPos: { x: number; y: number };
  gesture: "idle" | "drag:ready" | "drag:middle" | "drag:top" | "drag:bottom";
  Sun: ITimeSlot[];
  Mon: ITimeSlot[];
  Tue: ITimeSlot[];
  Wed: ITimeSlot[];
  Thu: ITimeSlot[];
  Fri: ITimeSlot[];
  Sat: ITimeSlot[];
  modal: { create: boolean; merge: boolean; details: boolean; confirm: boolean; drop: boolean };
};

export type ITimeSlot = {
  id: string;
  start: number;
  end: number;
};
