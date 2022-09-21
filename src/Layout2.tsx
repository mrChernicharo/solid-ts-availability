import { createPointerListeners } from "@solid-primitives/pointer";
import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { DEFAULT_SLOT_DURATION, INITIAL_STORE, MIN_SLOT_DURATION, WEEKDAYS } from "./lib/constants";
import { IStore, ITimeSlot, IWeekday } from "./lib/types";
// @ts-ignore
import idMaker from "@melodev/id-maker";
import {
  findOverlappingSlots,
  getLocaleHours,
  getObjWithOmittedProps,
  getScreenWidth,
  getScrollbarWidth,
  getWeekDays,
  readableTime,
  snapTime,
  timeToYPos,
  yPosToTime,
} from "./lib/utils";
import { store, setStore } from "./store";

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
  let last: { x: number; y: number } | null;
  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();
  const [modalRef, setModalRef] = createSignal<HTMLDivElement>();

  let timeDiff = 0;
  let timestamp = Date.now();
  //   const [store, setStore] = createStore<IStore>(INITIAL_STORE);

  const [sideBarStickyX, setSideBarStickyX] = createSignal(0);
  const [headerStickyY, setHeaderStickyY] = createSignal(0);
  const [scrollbarWidth, setScrollBarWidth] = createSignal(0);
  const [widgetWidth, setWidgetWidth] = createSignal(0);
  const [widgetTop, setWidgetTop] = createSignal(0);
  const [widgetLeft, setWidgetLeft] = createSignal(0);

  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, "pt-BR"));
  // const widgetWidth = () => props.colWidth * 7 + props.sideBarWidth + scrollbarWidth();

  const DAY_COLS = () => getWeekDays(props.dayCols, { firstDay: props.firstDay }) as IWeekday[];

  const yToTime = (y: number) => yPosToTime(y, props.minHour, props.maxHour, props.colHeight);
  const timeToY = (time: number) => timeToYPos(time, props.minHour, props.maxHour, props.colHeight);
  const readable = (time: number) => readableTime(time, props.locale);

  const slotIdx = (id: string) => store[store.day!].findIndex((s) => s.id === id);
  const getSlot = (id: string) => store[store.day!].find((s) => s.id === id);

  const getOverlappingSlots = (clickTime: number) => findOverlappingSlots(clickTime, clickTime, store[store.day!]);
  const getNearbySlots = (clickTime: number) =>
    findOverlappingSlots(clickTime - props.snapTo, clickTime + props.snapTo, store[store.day!]);

  const isModalOpen = () =>
    store.modal.create || store.modal.merge || store.modal.details || store.modal.confirm || store.modal.drop;

  const createNewTimeSlot = (day: IWeekday, time: number) => {
    let [start, end] = [Math.round(time - DEFAULT_SLOT_DURATION / 2), Math.round(time + DEFAULT_SLOT_DURATION / 2)];

    // prevent top overflow on creation
    if (start < props.minHour * 60) {
      start = props.minHour * 60;
      end = props.minHour * 60 + props.snapTo;
    }
    // prevent bottom overflow on creation
    if (end > props.maxHour * 60) {
      end = props.maxHour * 60;
      start = props.maxHour * 60 - props.snapTo;
    } else {
      [start, end] = [snapTime(start, props.snapTo), snapTime(end, props.snapTo)];
    }

    const newTimeSlot: ITimeSlot = {
      id: idMaker(),
      start,
      end,
    };
    return newTimeSlot;
  };

  const updateWidgetWidth = () => {
    const maxScreenW = () => getScreenWidth() * 0.96;

    const wWidth = () => {
      if (props.widgetHeight > props.colHeight + props.headerHeight) {
        return props.colWidth * (props.dayCols.length + 0.5);
      } else {
        return props.colWidth * (props.dayCols.length + 0.5) + getScrollbarWidth(widgetRef, "y");
      }
    };

    if (maxScreenW() < wWidth()) {
      setWidgetWidth(maxScreenW()); // whole widget fits the screen
      widgetRef.style.overflowY = "auto";
    } else {
      setWidgetWidth(wWidth()); // widget larger than screen
      widgetRef.style.overflowX = "auto";
    }
  };

  const handleDocumentScroll = (ref) => {
    const crossedX =
      document.scrollingElement!.scrollLeft >= ref.getBoundingClientRect().left + document.scrollingElement!.scrollLeft;

    const crossedY =
      document.scrollingElement!.scrollTop >= ref.getBoundingClientRect().top + document.scrollingElement!.scrollTop;

    if (crossedY) {
      setHeaderStickyY(-ref.getBoundingClientRect().top);
    } else {
      setHeaderStickyY(0);
    }
    if (crossedX) {
      setSideBarStickyX(-ref.getBoundingClientRect().left);
    } else {
      setSideBarStickyX(0);
    }
  };
  const observer = new ResizeObserver(updateWidgetWidth);

  onMount(() => {
    document.addEventListener("scroll", (e) => handleDocumentScroll(widgetRef));
    observer.observe(document.body);
  });

  onCleanup(() => {
    observer.unobserve(document.body);
  });

  createEffect(() => {
    setScrollBarWidth(getScrollbarWidth(widgetRef, "y")); // gotta consider resizing...sometimes scroll widths change
  });

  createPointerListeners({
    target: () => containerRef()!,
    onUp: ({ x, y }) => {
      console.log("up");

      timeDiff = Date.now() - timestamp;

      setStore("lastWindowPos", { x, y });
      setStore("lastContainerPos", {
        x: x - widgetLeft() - props.colWidth / 2 + widgetRef.scrollLeft,
        y: y - widgetTop() + (document.scrollingElement?.scrollTop || 0) - props.headerHeight + widgetRef.scrollTop,
      });

      if (isModalOpen() || timeDiff > 200) return;

      if (store.gesture === "drag:middle" && getOverlappingSlots(yToTime(store.lastContainerPos.y)).length) {
        setStore("modal", "details", true);
        return;
      }

      if (store.gesture === "idle" && getNearbySlots(yToTime(store.lastContainerPos.y)).length) {
        setStore("modal", "merge", true);
        return;
      }
      setStore("modal", "create", true);
    },
  });

  createPointerListeners({
    target: () => document.body,
    onDown: ({ x, y }) => {
      last = { x, y };
      timestamp = Date.now();
    },
    onUp: ({ x, y }) => {
      // console.log("up");
      setTimeout(() => setStore("gesture", "idle"), 100);
      last = null;

      if (!store.slotId || !store.day || !store[store.day!].length || slotIdx(store.slotId) === -1) return;

      const overlapping = findOverlappingSlots(
        getSlot(store.slotId)!.start,
        getSlot(store.slotId)!.end,
        store[store.day].filter((s) => s.id !== store[store.day!][slotIdx(store.slotId!)].id)
      );

      // console.log("dropped");
      if (overlapping.length && !store.modal.details) {
        setStore("modal", "drop", true);
      }

      setStore(store.day!, slotIdx(store.slotId), (slot) => ({
        start: snapTime(slot.start, props.snapTo),
        end: snapTime(slot.end, props.snapTo),
      }));
    },
    onLeave: () => (last = null),
    onCancel: () => (last = null),
    onMove: ({ x, y }) => {
      if (!last || store.gesture === "idle") return;

      if (store.gesture === "drag:middle") {
        // console.log({ x: last.x, y: last.y });
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            start: yToTime(timeToY(slot.start) + y - last!.y),
            end: yToTime(timeToY(slot.end) + y - last!.y),
          };

          if (newSlot.start < props.minHour * 60 || newSlot.end > props.maxHour * 60) return slot;
          return newSlot;
        });
      }

      if (store.gesture === "drag:top") {
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            start: yToTime(timeToY(slot.start) + y - last!.y),
            end: slot.end,
          };
          const duration = newSlot.end - newSlot.start;

          if (newSlot.start < props.minHour * 60 || duration < Math.max(MIN_SLOT_DURATION, props.snapTo)) return slot;
          return newSlot;
        });
      }

      if (store.gesture === "drag:bottom") {
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            ...slot,
            end: yToTime(timeToY(slot.end) + y - last!.y),
          };
          const duration = newSlot.end - newSlot.start;

          if (newSlot.end > props.maxHour * 60 || duration < Math.max(MIN_SLOT_DURATION, props.snapTo)) return slot;
          return newSlot;
        });
      }

      last = { x, y };
    },
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
          width: `${widgetWidth()}px`,
          // width: `min(${widgetWidth()}px, calc(100vw - 4rem))`,
          height: props.widgetHeight + "px",
        }}
      >
        {/*  */}
        <header
          class="header sticky top-0 flex bg-blue-400 z-10"
          style={{ width: props.colWidth * 7 + props.sideBarWidth + "px", translate: `0px ${headerStickyY()}px` }}
        >
          <div class="shim border-l-[1px] bg-red-600" style={{ width: props.sideBarWidth + "px" }}></div>
          <For each={DAY_COLS()}>
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
            <For each={DAY_COLS()}>
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
