import { WEEKDAYS } from "./constants";
import { IWeekday } from "./types";

export const normalizeWeekday = (weekday: string) =>
  (weekday[0].toUpperCase() + weekday.slice(1, 3).toLowerCase()) as IWeekday;

export const getWeekDays = (
  dayCols: string[],
  options: {
    firstDay: IWeekday;
    locale?: string;
    format?: "short" | "long" | "narrow";
    noFormatting?: boolean;
  }
) => {
  const cols = dayCols.map((d) => normalizeWeekday(d));
  const weekday = normalizeWeekday(options.firstDay || "Mon");

  const startDay = {
    weekday,
    dayNum: WEEKDAYS.indexOf(weekday),
  };

  const weekdays: {
    date: Date;
    dayNum: number;
    weekday: IWeekday;
    localized: string;
  }[] = [];

  let i = 0;
  while (i < 7) {
    const date = new Date(new Date().getTime() + i * 24 * 3600 * 1000);
    const weekday = date.toLocaleDateString("en", { weekday: "short" }) as IWeekday;
    const localized = date.toLocaleDateString(options.locale || "en", {
      weekday: options.format || "short",
    });

    const weekdayObj = { date, dayNum: date.getDay(), weekday, localized };

    weekdays.push(weekdayObj);
    i++;
  }

  const reindexedDays = weekdays
    .map((d) => {
      if (d.dayNum < startDay.dayNum) d.dayNum += 7;
      return d;
    })
    .sort((a, b) => a.dayNum - b.dayNum)
    .filter((d) => cols.includes(d.weekday));

  if (options.noFormatting) return reindexedDays.map((d) => d.weekday);

  return reindexedDays.map((d) => d.localized);
};

export const getLocaleHours = (minHour: number, maxHour: number, locale = "en") => {
  const hours: string[] = [];
  let curr = minHour;

  while (curr < maxHour) {
    let hour = "";
    if (locale === "en") {
      if (curr === 0) hour = "12 AM";
      if (curr === 12) hour = "12 PM";
      if (curr !== 0 && curr !== 12) hour = curr < 12 ? curr + " AM" : curr - 12 + " PM";
    } else {
      hour = curr + ":00";
    }

    hours.push(hour);
    curr++;
  }

  return hours;
};

export function timeToYPos(minutes: number, minHour: number, maxHour: number, columnHeight: number) {
  const [start, end] = [minHour * 60, maxHour * 60];

  const percent = (minutes - start) / (end - start);
  const res = columnHeight * percent;

  return res;
}

export function yPosToTime(yPos: number, minHour: number, maxHour: number, columnHeight: number) {
  const [start, end] = [minHour * 60, maxHour * 60];

  const percent = yPos / columnHeight;

  const timeClicked = (end - start) * percent + start;
  // console.log({ yPos, minHour, percent, timeClicked });

  return Math.round(timeClicked);
}

export function readableTime(minutes: number, locale = "en") {
  const [hours, mins] = [Math.floor(minutes / 60), minutes % 60];

  let h = hours < 10 ? `0${hours}` : hours;
  let m = mins < 10 ? `0${mins}` : mins;

  let res = "";
  if (locale === "en") {
    if (hours === 0) {
      res = `12:${m} AM`;
    }
    if (hours === 12) {
      res = `12:${m} PM`;
    }
    if (hours !== 0 && hours !== 12) {
      if (hours > 11) {
        res = `${+h - 12}:${m} PM`;
      } else {
        res = `${+h}:${m} AM`;
      }
    }
  } else {
    res = `${h}:${m}`;
  }

  return res;
}
