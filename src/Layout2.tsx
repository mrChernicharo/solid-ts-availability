import { createMemo, For } from "solid-js";
import { WEEKDAYS } from "./lib/constants";
import { getLocaleHours } from "./lib/utils";

export default function Layout2(props) {
  const [minHour, maxHour] = [7, 21];
  const HOURS = createMemo(() => getLocaleHours(minHour, maxHour, "pt-BR"));

  return (
    <div class="body h-[200vh]">
      {/*  */}
      <div class="widget border mx-auto" style={{ width: "min(1032px, calc(100vw - 2rem))" }}>
        {/*  */}
        <header class="sticky top-0 flex bg-blue-400 z-10" style={{ width: 200 * 7 + 80 + "px" }}>
          <div class="border w-[80px] h-[50px]"></div>
          <For each={WEEKDAYS}>{(weekday) => <div class="border w-[200px] h-[50px]"></div>}</For>
        </header>

        <div class="flex bg-green-400" style={{ width: 200 * 7 + 80 + "px" }}>
          <aside class="sticky left-0">
            <div class="absolute border h-[1000px] w-[80px] bg-orange-400"></div>
          </aside>

          <div class="sticky top-0 flex" style={{ width: 200 * 7 + 80 + "px" }}>
            <div
              class="border w-[80px] h-[250px] bg-red-700"
              style={{ "clip-path": `polygon(0 0, 100% 100%, 100% 0)` }}
            ></div>
            <For each={WEEKDAYS}>{(weekday) => <div class="border w-[200px] h-[1000px]"></div>}</For>
          </div>
        </div>
      </div>
    </div>
  );
}
