import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { WEEKDAYS } from "./lib/constants";
import { getLocaleHours, getScrollbarWidth, hasScrollbar } from "./lib/utils";
import s from "./WidgetLayout.module.css";

export default function WidgetLayout(props) {
  let headerRef!: HTMLDivElement;
  let gridRef!: HTMLDivElement;
  let sideBarRef!: HTMLDivElement;

  const [minHour, maxHour] = [7, 21];

  const HOURS = createMemo(() => getLocaleHours(minHour, maxHour, "pt-BR"));

  const [hasYScrollBar, setHasYScrollBar] = createSignal(false);
  const [hasXScrollBar, setHasXScrollBar] = createSignal(false);

  onMount(() => {
    gridRef.addEventListener("scroll", (e) => {
      headerRef.scrollTo({ left: gridRef.scrollLeft });
      sideBarRef.scrollTo({ top: gridRef.scrollTop });
      setHasXScrollBar(hasScrollbar(gridRef, "x"));
      setHasYScrollBar(hasScrollbar(gridRef, "y"));
    });
  });

  createEffect(() => {
    // console.log(hasYScrollBar());
  });

  return (
    <div style={{ border: "1px solid blue" }}>
      <div ref={sideBarRef} class={s.sideBar}>
        <For each={HOURS()}>
          {(hour) => (
            <div class={s.hour} style={{ height: "100px" }}>
              {hour}
            </div>
          )}
        </For>
        <Show when={hasXScrollBar()}>
          <div class={s.shim} style={{ height: `${getScrollbarWidth(gridRef, "x")}px` }}></div>
        </Show>
      </div>
      <div class={s.wrap}>
        <div class={s.headers}>
          <div ref={headerRef} class={s.scroller}>
            <For each={WEEKDAYS}>
              {(weekday) => (
                <div class={s.track}>
                  <div class={s.heading}>{weekday}</div>
                </div>
              )}
            </For>
            <Show when={hasYScrollBar()}>
              <div class={s.shim} style={{ flex: `1 0 ${getScrollbarWidth(gridRef, "y")}px` }}></div>
            </Show>
          </div>
        </div>

        <div class={s.grid} ref={gridRef}>
          <For each={WEEKDAYS}>
            {(weekday) => (
              <div class={s.track}>
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
    </div>
  );
}
