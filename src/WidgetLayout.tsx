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

  const handleScrolls = () => {
    headerRef.scrollTo({ left: gridRef.scrollLeft });
    setHasXScrollBar(hasScrollbar(gridRef, "x"));
    setHasYScrollBar(hasScrollbar(gridRef, "y"));
  };

  onMount(() => {
    handleScrolls();
    gridRef.addEventListener("scroll", handleScrolls);
  });

  createEffect(() => {
    console.log({ x: hasXScrollBar(), y: hasYScrollBar() });
  });

  return (
    <div class={s.widget}>
      <div class={s.wrap}>
        <div class={s.headers}>
          <div ref={headerRef} class={s.scroller}>
            <div class={`${s.track} ${s.time}`}>
              <div class={s.heading}>time</div>
            </div>
            <For each={WEEKDAYS}>
              {(weekday) => (
                <div class={s.track}>
                  <div class={s.heading}>{weekday}</div>
                </div>
              )}
            </For>
            <Show when={hasYScrollBar()}>
              <div class={s.shim} style={{ flex: `0 0 ${getScrollbarWidth(gridRef, "y")}px` }}></div>
            </Show>
          </div>
        </div>

        <div class={s.grid} ref={gridRef}>
          <div class={`${s.track} ${s.time}`}>
            <For each={HOURS()}>{(hour) => <div class={s.entry}>{hour}</div>}</For>
          </div>
          <For each={WEEKDAYS}>
            {(weekday) => (
              <div class={s.track}>
                <For each={HOURS()}>{(hour) => <div class={s.entry}></div>}</For>
              </div>
            )}
          </For>
        </div>
      </div>
    </div>
  );
}
