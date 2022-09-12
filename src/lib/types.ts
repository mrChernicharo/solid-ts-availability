export type IWeekday = "Sun" | "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
export type IGesture = "idle" | "drag:middle" | "drag:top" | "drag:bottom";
export type IPalette = "light" | "dark";
export type ISnapOption = 30 | 20 | 15 | 10 | 5;
export type IStore = {
  slotId: string | null;
  slotIdx: number | null;
  gesture: "idle" | "drag:middle" | "drag:top" | "drag:bottom";
  Sun: ITimeSlot[];
  Mon: ITimeSlot[];
  Tue: ITimeSlot[];
  Wed: ITimeSlot[];
  Thu: ITimeSlot[];
  Fri: ITimeSlot[];
  Sat: ITimeSlot[];
};

type ITimeSlot = {
  id: string;
  y: number;
  height: number;
};
