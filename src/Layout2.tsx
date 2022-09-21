import { createPerPointerListeners, createPointerListeners } from "@solid-primitives/pointer";
import { batch, createEffect, createMemo, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { createStore } from "solid-js/store";
import { DEFAULT_SLOT_DURATION, INITIAL_STORE, MIN_SLOT_DURATION, MODAL_TYPES, THEME, WEEKDAYS } from "./lib/constants";
import { IStore, ITimeSlot, IWeekday } from "./lib/types";
// @ts-ignore
import idMaker from "@melodev/id-maker";
import {
  createRippleEffect,
  findOverlappingSlots,
  getLocaleHours,
  getMergedTimeslots,
  getObjWithOmittedProps,
  getScreenHeight,
  getScreenWidth,
  getScrollbarWidth,
  getWeekDays,
  hasScrollbar,
  readableTime,
  snapTime,
  timeToYPos,
  yPosToTime,
} from "./lib/utils";
import { store, setStore } from "./store";
import { FaSolidCalendarPlus, FaSolidGrip } from "solid-icons/fa";
import { FiX, FiLayers, FiCheck, FiTrash } from "solid-icons/fi";
import { Portal } from "solid-js/web";

export default function Layout2(props) {
  let widgetRef!: HTMLDivElement;
  let last: { x: number; y: number } | null;
  const [gridRef, setGridRef] = createSignal<HTMLDivElement>();
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

  const [modalTop, setModalTop] = createSignal(0);
  const [modalLeft, setModalLeft] = createSignal(0);
  const [modalHeight, setModalHeight] = createSignal(0);
  const [modalWidth, setModalWidth] = createSignal(0);

  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, "pt-BR"));
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
        return props.colWidth * props.dayCols.length + props.sideBarWidth;
      } else {
        return props.colWidth * props.dayCols.length + props.sideBarWidth + getScrollbarWidth(widgetRef, "y");
      }
    };

    if (maxScreenW() < wWidth()) {
      // console.log("doesn't fit");
      setWidgetWidth(maxScreenW()); // widget larger than screen
    } else {
      // console.log("fits");
      setWidgetWidth(wWidth()); // whole widget fits the screen
    }
  };
  const updateWidgetBounds = () => {
    const widgetAbsTop = widgetRef.getBoundingClientRect().top + (document.scrollingElement?.scrollTop || 0);
    setWidgetTop(widgetAbsTop);
    setWidgetLeft(widgetRef.getBoundingClientRect().left);
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
    updateWidgetWidth();
    updateWidgetBounds();
    setScrollBarWidth(getScrollbarWidth(widgetRef, "y")); // gotta consider resizing...sometimes scroll widths change
  });

  createEffect(() => {
    if (isModalOpen()) {
      setModalTop((p) =>
        store.lastWindowPos.y < getScreenHeight() / 2
          ? store.lastWindowPos.y + document.scrollingElement!.scrollTop
          : store.lastWindowPos.y + document.scrollingElement!.scrollTop - modalHeight()
      );
      setModalLeft((p) =>
        store.lastWindowPos.x < getScreenWidth() / 2
          ? store.lastWindowPos.x + document.scrollingElement!.scrollLeft
          : store.lastWindowPos.x + document.scrollingElement!.scrollLeft - modalWidth()
      );
      setModalHeight(modalRef()!.getBoundingClientRect().height);
      setModalWidth(modalRef()!.getBoundingClientRect().width);
    }
  });

  createEffect(() => {
    props.colHeight, props.colWidth, props.widgetHeight, props.headerHeight;
    updateWidgetWidth();
  });

  createEffect(() => {
    props.onChange(store);
  });

  // GRID POINTER LISTENER
  createPointerListeners({
    target: () => gridRef()!,
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

  // DOCUMENT POINTER LISTENER
  createPointerListeners({
    target: () => document.body,
    onDown: ({ x, y }) => {
      last = { x, y };
      timestamp = Date.now();
    },
    onUp: ({ x, y }) => {
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
      <main
        ref={widgetRef}
        class="widget overflow-scroll"
        style={{
          width: `${widgetWidth()}px`,
          height: props.widgetHeight + "px",
        }}
      >
        {/* TOP BAR */}
        <header
          class="header sticky top-0 flex z-10"
          style={{
            width: props.colWidth * 7 + props.sideBarWidth + "px",
            translate: `0px ${headerStickyY()}px`,
            background: THEME[props.palette].accent2,
          }}
        >
          <div style={{ width: props.sideBarWidth + "px" }}></div>
          <For each={DAY_COLS()}>
            {(weekday) => (
              <div
                class="border-l-[1px] flex justify-center items-center"
                style={{
                  height: props.headerHeight + "px",
                  width: props.colWidth + "px",
                  "border-color": THEME[props.palette].lightText,
                }}
              >
                {weekday}
              </div>
            )}
          </For>
        </header>

        <div
          class="main flex"
          style={{ width: props.colWidth * 7 + props.sideBarWidth + "px", background: THEME[props.palette].bg2 }}
        >
          {/* SIDE BAR */}
          <aside class="sidebar sticky left-0" style={{ translate: `${sideBarStickyX()}px 0px` }}>
            <div
              class="absolute z-20"
              style={{ width: props.sideBarWidth + "px", background: THEME[props.palette].primary2 }}
            >
              <For each={HOURS()}>
                {(hour, i) => (
                  <div
                    class="ml-[1px] flex justify-center"
                    style={{
                      "border-color": THEME[props.palette].lightText,
                      "border-top": i() ? `1px solid` : "",
                      height: props.colHeight / (props.maxHour - props.minHour) + "px",
                    }}
                  >
                    {hour}
                  </div>
                )}
              </For>
            </div>
          </aside>

          {/* GRID */}
          <section
            ref={setGridRef}
            class="columns sticky top-0 flex"
            style={{ width: props.colWidth * 7 + props.sideBarWidth + "px" }}
          >
            <div
              class="shim"
              style={{ width: props.sideBarWidth + "px", "clip-path": `polygon(0 0, 100% 100%, 100% 0)` }}
            ></div>
            <For each={DAY_COLS()}>
              {(weekday, dayIdx) => {
                let columnRef!: HTMLDivElement;

                // COLUMN POINTER LISTENER
                createPerPointerListeners({
                  target: () => columnRef,
                  onEnter(e, { onDown, onUp }) {
                    onDown(({ x, y, offsetX, offsetY }) => {
                      setStore("day", weekday);
                      console.log({ target: e.target });
                      // createRippleEffect(offsetX, offsetY, columnRef);
                    });
                  },
                });

                return (
                  <div
                    class="column relative border-l-[1px]"
                    ref={columnRef}
                    style={{
                      "border-color": THEME[props.palette].lightText,
                      width: props.colWidth + "px",
                      height: props.colHeight + "px",
                    }}
                  >
                    {/* ********* TIME SLOTS ************ */}
                    <For each={store[weekday]}>
                      {(slot, idx) => {
                        let slotRef!: HTMLDivElement;
                        let middleRef!: HTMLDivElement;
                        let topRef!: HTMLDivElement;
                        let bottomRef!: HTMLDivElement;

                        // SLOT LISTENER
                        createPointerListeners({
                          target: () => slotRef,
                          onDown: ({ offsetX, offsetY }) => {
                            setStore("slotId", slot.id);
                          },
                        });
                        // MIDDLE LISTENER
                        createPointerListeners({
                          target: () => middleRef,
                          onDown: ({ offsetX, offsetY, target }) => {
                            batch(() => {
                              setStore("gesture", "drag:middle");
                              createRippleEffect(offsetX, offsetY, slotRef);
                            });
                          },
                        });
                        // TOP LISTENER
                        createPointerListeners({
                          target: () => topRef,
                          onDown: (e) => setStore("gesture", "drag:top"),
                        });
                        // BOTTOM LISTENER
                        createPointerListeners({
                          target: () => bottomRef,
                          onDown: (e) => setStore("gesture", "drag:bottom"),
                        });

                        const height = createMemo(() => `${timeToY(slot.end) - timeToY(slot.start)}px`);
                        const top = createMemo(() => `${timeToY(slot.start)}px`);
                        // const left = () => props.colWidth * (idx() + 1) + "px";
                        const margin = createMemo(() => `${props.colWidth * 0.05}px`);

                        /* ********* TIME SLOT ************ */
                        return (
                          <div
                            id={slot.id}
                            ref={slotRef}
                            class="absolute rounded-lg overflow-clip opacity-80"
                            style={{
                              top: top(),
                              background: THEME[props.palette].primary2,
                              left: `calc(${margin()} )`,
                              width: `calc(${props.colWidth}px - calc(${margin()} * 2))`,
                            }}
                          >
                            <div
                              ref={topRef}
                              class="absolute flex justify-center w-1/2 top-0 left-0 opacity-60"
                              style={{ "touch-action": "none" }}
                            >
                              <FaSolidGrip class="opacity-50 mt-[2px]" />
                            </div>
                            <div
                              ref={middleRef}
                              class="w-full h-[100%] flex flex-col justify-center items-center overflow-clip text-xs"
                              style={{ "touch-action": "none", "user-select": "none", height: height() }}
                            >
                              <p>{`${readable(slot.start)} - ${readable(slot.end)}`}</p>
                              <p>{store.slotId === slot.id ? store.gesture : "idle"}</p>
                            </div>
                            <div
                              ref={bottomRef}
                              class="absolute flex justify-center w-1/2 bottom-0 right-0 opacity-60"
                              style={{ "touch-action": "none" }}
                            >
                              <FaSolidGrip class="opacity-50 mb-[2px]" />
                            </div>
                          </div>
                        );
                      }}
                    </For>

                    {/* ********* HOUR LINES ********** */}
                    <For each={HOURS()}>
                      {(hour, hourIdx) => (
                        <Show when={hourIdx() > 0}>
                          <div
                            class="absolute h-[1px] pointer-events-none z-[-1]"
                            style={{
                              top: `${(props.colHeight / HOURS().length) * hourIdx()}px`,
                              width: `${props.colWidth - 1}px`,
                              background: `${THEME[props.palette].lightText}`,
                            }}
                          ></div>
                        </Show>
                      )}
                    </For>
                  </div>
                );
              }}
            </For>

            {/* ************* MODAL *************** */}
            <Portal mount={document.getElementById("root")!}>
              <Show when={isModalOpen()}>
                <div
                  id="modal"
                  ref={setModalRef}
                  class="absolute z-50 p-4 top-0 text-lg rounded-lg overflow-clip"
                  style={{
                    background: `${THEME[props.palette].bg2}`,
                    color: `${THEME[props.palette].text2}`,
                    top: `${modalTop()}px`,
                    left: `${modalLeft()}px`,
                  }}
                >
                  <Switch>
                    <Match when={store.modal.create}>
                      <section class="text-right">
                        <button>
                          <FiX class="text-2xl" onClick={(e) => setStore("modal", "create", false)} />
                        </button>
                      </section>
                      <section>
                        <button
                          onClick={(e) => {
                            const newSlot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                            setStore(store.day!, (slots) => [...slots, newSlot]);
                            setStore("modal", "create", false);
                          }}
                        >
                          <FaSolidCalendarPlus class="text-2xl" />
                        </button>
                      </section>
                    </Match>

                    <Match when={store.modal.merge}>
                      <section class="text-right">
                        <button>
                          <FiX class="text-2xl" onClick={(e) => setStore("modal", "merge", false)} />
                        </button>
                      </section>
                      <section>
                        <button
                          onClick={(e) => {
                            const slot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                            const { mergedSlots, newSlot } = getMergedTimeslots(slot, store[store.day!]);

                            setStore(store.day!, mergedSlots);
                            setStore("slotId", newSlot.id);
                            setStore("modal", "merge", false);
                          }}
                        >
                          <FiLayers class="text-2xl" />
                        </button>
                        <button
                          onClick={(e) => {
                            const newSlot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                            setStore(store.day!, (slots) => [...slots, newSlot]);
                            setStore("modal", "merge", false);
                          }}
                        >
                          <FaSolidCalendarPlus class="text-2xl" />
                        </button>
                      </section>
                    </Match>

                    <Match when={store.modal.drop}>
                      <section class="text-right">
                        <button>
                          <FiX class="text-2xl" onClick={(e) => setStore("modal", "drop", false)} />
                        </button>
                      </section>
                      <section>
                        <button
                          onClick={(e) => {
                            const slot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                            const { mergedSlots, newSlot } = getMergedTimeslots(slot, store[store.day!]);

                            setStore(store.day!, mergedSlots);
                            setStore("slotId", newSlot.id);
                            setStore("modal", "drop", false);
                          }}
                        >
                          <FiLayers class="text-2xl" />
                        </button>
                      </section>
                    </Match>

                    <Match when={store.modal.details}>
                      <section class="text-right">
                        <button>
                          <FiX class="text-2xl" onClick={(e) => setStore("modal", "details", false)} />
                        </button>
                      </section>

                      <section>
                        <p class="text-xs">{store.slotId}</p>
                        <button onClick={(e) => setStore("modal", "details", false)}>
                          <FiCheck class="text-2xl" />
                        </button>
                        <button
                          onClick={(e) => {
                            setStore("modal", "details", false);
                            setStore(store.day!, (slots) => slots.filter((s) => s.id !== store.slotId));
                          }}
                        >
                          <FiTrash class="text-2xl" />
                        </button>
                      </section>
                    </Match>
                  </Switch>
                  {/* ************* OVERLAY ***************  */}
                </div>
                <div
                  class="fixed top-0 left-0 z-20 w-[10000px] h-[10000px] opacity-10 bg-fuchsia-800"
                  onPointerUp={(e) => MODAL_TYPES.forEach((type) => setStore("modal", type as any, false))}
                ></div>
              </Show>
            </Portal>
          </section>
        </div>
      </main>
    </Show>
  );
}
