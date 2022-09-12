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
