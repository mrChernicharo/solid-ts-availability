import { createMemo, createSignal, For, onMount } from "solid-js";
import { WEEKDAYS } from "./lib/constants";
import { getLocaleHours } from "./lib/utils";

export default function Layout2(props) {
  let widgetRef!: HTMLDivElement;
  const [minHour, maxHour] = [7, 21];

  const [headerTransX, setHeaderTransX] = createSignal(0);
  const [headerTransY, setHeaderTransY] = createSignal(0);
  const HOURS = createMemo(() => getLocaleHours(minHour, maxHour, "pt-BR"));

  const handleScrolls = (e) => {
    const crossedX =
      document.scrollingElement!.scrollLeft >=
      widgetRef.getBoundingClientRect().left + document.scrollingElement!.scrollLeft;

    const crossedY =
      document.scrollingElement!.scrollTop >=
      widgetRef.getBoundingClientRect().top + document.scrollingElement!.scrollTop;

    if (crossedY) {
      setHeaderTransY(-widgetRef.getBoundingClientRect().top);
    } else {
      setHeaderTransY(0);
    }
    if (crossedX) {
      setHeaderTransX(-widgetRef.getBoundingClientRect().left);
    } else {
      setHeaderTransX(0);
    }
  };
  onMount(() => {
    document.addEventListener("scroll", handleScrolls);
  });

  return (
    <div class="body w-[140vw] h-[200vh]">
      {/*  */}
      <div
        ref={widgetRef}
        class="widget mx-auto overflow-scroll"
        style={{ width: "min(1032px, calc(100vw - 2rem))", height: "500px" }}
      >
        {/*  */}
        <header
          class="header sticky top-0 flex bg-blue-400 z-10"
          style={{ width: 200 * 7 + 80 + "px", translate: `0px ${headerTransY()}px` }}
        >
          <div class="border w-[80px] h-[50px]"></div>
          <For each={WEEKDAYS}>{(weekday) => <div class="border w-[200px] h-[50px]">day</div>}</For>
        </header>

        <div class="main flex bg-green-400" style={{ width: 200 * 7 + 80 + "px" }}>
          <aside class="sidebar sticky left-0" style={{ translate: `${headerTransX()}px 0px` }}>
            <div class="absolute h-[1000px] w-[80px] bg-orange-400"></div>
          </aside>

          <div class="columns sticky top-0 flex" style={{ width: 200 * 7 + 80 + "px" }}>
            <div class="w-[80px] h-[500px] bg-red-700" style={{ "clip-path": `polygon(0 0, 100% 100%, 100% 0)` }}></div>
            <For each={WEEKDAYS}>{(weekday) => <div class="border w-[200px] h-[1000px]">col</div>}</For>
          </div>
        </div>
      </div>
    </div>
  );
}
