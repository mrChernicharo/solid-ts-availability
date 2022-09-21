import { createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { INITIAL_STORE, WEEKDAYS } from "./lib/constants";
import { IStore } from "./lib/types";
import { getLocaleHours, getObjWithOmittedProps, getScrollbarWidth } from "./lib/utils";
import { store } from "./store";

//     locale={locale()}
//     dayCols={cols()} // omit days if you want, order doesn't matter, repeated items don't matter
//     firstDay={firstDay()} // first dayColumn
//     palette={palette()} // light | dark
//     open={isOpen()}
//     minHour={minHour()}
//     maxHour={endHour()}
//     widgetHeight={widgetHeight()}
//     headerHeight={headerHeight()}
//     colHeight={colHeight()}
//     colWidth={colWidth()}
//     sideBarWidth={80}
//     snapTo={snap()}
//     onChange={(val: any) => setValue(val)}

export default function Layout2(props) {
  let widgetRef!: HTMLDivElement;
  //   const [store, setStore] = createStore<IStore>(INITIAL_STORE);

  const [sideBarStickyX, setSideBarStickyX] = createSignal(0);
  const [headerStickyY, setHeaderStickyY] = createSignal(0);
  const [scrollbarWidth, setScrollBarWidth] = createSignal(0);
  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, "pt-BR"));
  const widgetWidth = () => props.colWidth * 7 + props.sideBarWidth + scrollbarWidth();

  const handleDocumentScroll = (e) => {
    const crossedX =
      document.scrollingElement!.scrollLeft >=
      widgetRef.getBoundingClientRect().left + document.scrollingElement!.scrollLeft;

    const crossedY =
      document.scrollingElement!.scrollTop >=
      widgetRef.getBoundingClientRect().top + document.scrollingElement!.scrollTop;

    if (crossedY) {
      setHeaderStickyY(-widgetRef.getBoundingClientRect().top);
    } else {
      setHeaderStickyY(0);
    }
    if (crossedX) {
      setSideBarStickyX(-widgetRef.getBoundingClientRect().left);
    } else {
      setSideBarStickyX(0);
    }
  };

  onMount(() => {
    document.addEventListener("scroll", handleDocumentScroll);
  });

  createEffect(() => {
    setScrollBarWidth(getScrollbarWidth(widgetRef, "y")); // gotta consider resizing...sometimes scroll widths change
  });

  return (
    <Show
      when={props.open}
      fallback={
        <div>
          <pre class="text-sm">
            {JSON.stringify(
              getObjWithOmittedProps(store, ["modal", "day", "slotId", "lastContainerPos", "lastWindowPos", "gesture"]),
              null,
              2
            )}
          </pre>
        </div>
      }
    >
      <div
        ref={widgetRef}
        class="widget overflow-scroll"
        style={{
          width: `min(${widgetWidth()}px, calc(100vw - 4rem))`,
          height: props.widgetHeight + "px",
        }}
      >
        {/*  */}
        <header
          class="header sticky top-0 flex bg-blue-400 z-10"
          style={{ width: props.colWidth * 7 + props.sideBarWidth + "px", translate: `0px ${headerStickyY()}px` }}
        >
          <div class="shim border-l-[1px] bg-red-600" style={{ width: props.sideBarWidth + "px" }}></div>
          <For each={WEEKDAYS}>
            {(weekday) => (
              <div class="border-l-[1px]" style={{ height: props.headerHeight + "px", width: props.colWidth + "px" }}>
                {weekday}
              </div>
            )}
          </For>
        </header>

        <div class="main flex bg-green-400" style={{ width: props.colWidth * 7 + props.sideBarWidth + "px" }}>
          {/*  */}
          <aside class="sidebar sticky left-0" style={{ translate: `${sideBarStickyX()}px 0px` }}>
            <div class="absolute z-20 bg-orange-400" style={{ width: props.sideBarWidth + "px" }}>
              <For each={HOURS()}>
                {(hour, i) => (
                  <div
                    class="border-b-[1px]"
                    style={{
                      "border-top": i() ? "" : "1px solid #fff",
                      height: props.colHeight / (props.maxHour - props.minHour) + "px",
                    }}
                  >
                    {hour}
                  </div>
                )}
              </For>
            </div>
          </aside>

          {/*  */}
          <div class="columns sticky top-0 flex" style={{ width: props.colWidth * 7 + props.sideBarWidth + "px" }}>
            <div
              class="shim bg-red-700 opacity-40"
              style={{ width: props.sideBarWidth + "px", "clip-path": `polygon(0 0, 100% 100%, 100% 0)` }}
            ></div>
            <For each={WEEKDAYS}>
              {(weekday) => (
                <div
                  class="column border-l-[1px]"
                  style={{
                    width: props.colWidth + "px",
                  }}
                >
                  <For each={HOURS()}>
                    {(hour) => (
                      <div
                        class="border-t-[1px]"
                        style={{
                          height: props.colHeight / (props.maxHour - props.minHour) + "px",
                        }}
                      >
                        {hour}
                      </div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </div>
    </Show>
  );
}
