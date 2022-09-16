import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { WEEKDAYS } from "./lib/constants";
import { getLocaleHours, getScrollbarWidth, hasScrollbar } from "./lib/utils";
import s from "./WidgetLayout.module.css";

export default function WidgetLayout(props) {
  let headerRef!: HTMLDivElement;
  let gridRef!: HTMLDivElement;

  const [minHour, maxHour] = [7, 21];

  const HOURS = createMemo(() => getLocaleHours(minHour, maxHour, "pt-BR"));

  const [hasYScrollBar, setHasYScrollBar] = createSignal(false);
  const [hasXScrollBar, setHasXScrollBar] = createSignal(false);

  onMount(() => {
    gridRef.addEventListener("scroll", (e) => {
      headerRef.scrollTo({ left: gridRef.scrollLeft });
      setHasXScrollBar(hasScrollbar(gridRef, "x"));
      setHasYScrollBar(hasScrollbar(gridRef, "y"));
    });
  });

  createEffect(() => {
    // console.log(hasYScrollBar());
  });

  return (
    <div class={s.wrap}>
      <div class={s.headers}>
        <div class={s.scroller} ref={headerRef}>
          {/* <div class={s.leftShim} style={{ flex: `1 0 50px` }}></div> */}
          <For each={WEEKDAYS}>
            {(weekday, idx) => (
              <div
                class={s.track}
                style={{
                  flex: idx() === 0 ? "1 0 min(33vw, 270px)" : "1 0 min(33vw, 200px)",
                }}
              >
                <div class={s.heading}>{weekday}</div>
              </div>
            )}
          </For>
          <Show when={hasYScrollBar()}>
            <div class={s.rightShim} style={{ flex: `1 0 ${getScrollbarWidth(gridRef, "y")}px` }}></div>
          </Show>
        </div>
      </div>

      <div class={s.grid} ref={gridRef}>
        {/* <div class={s.leftShim} style={{ flex: `1 0 50px` }}></div> */}
        <div
          style={{
            position: "sticky",
            "min-width": "70px",
            border: "1px solid",
            left: 0,
            height: `${HOURS().length * 100}px`,
          }}
        ></div>
        <For each={WEEKDAYS}>
          {(weekday, idx) => (
            <div
              class={s.track}
              style={{
                flex: "1 0 min(33vw, 200px)",
              }}
            >
              <For each={HOURS()}>
                {(hour) => (
                  <div class={s.entry}>
                    <h3>{hour}</h3>
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
