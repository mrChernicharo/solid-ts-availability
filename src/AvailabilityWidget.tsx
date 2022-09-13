import { createPerPointerListeners, createPointerListeners } from "@solid-primitives/pointer";
import {
  batch,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  Match,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Portal } from "solid-js/web";
import {
  DEFAULT_SLOT_DURATION,
  INITIAL_STORE,
  MIN_SLOT_DURATION,
  MODAL_TYPES,
  SCROLL_BAR,
  THEME,
} from "./lib/constants";
import { IWeekday, IPalette, IStore, ITimeSlot } from "./lib/types";
import { FiCalendar, FiCheck, FiDelete, FiLayers, FiPlus, FiTrash, FiX } from "solid-icons/fi";
import { FaSolidCalendarPlus } from "solid-icons/fa";
import {
  findOverlappingSlots,
  getLocaleHours,
  getMergedTimeslots,
  getWeekDays,
  readableTime,
  snapTime,
  timeToYPos,
  yPosToTime,
} from "./lib/utils";
// @ts-ignore
import idMaker from "@melodev/id-maker";
interface IProps {
  locale: string;
  dayCols: IWeekday[];
  firstDay: IWeekday;
  open: boolean;
  minHour: number;
  maxHour: number;
  widgetHeight: number;
  headerHeight: number;
  colHeight: number;
  colWidth: number;
  snapTo: number;
  onChange: any;
  palette: IPalette;
}

export default function AvailabilityWidget(props: IProps) {
  let widgetRef!: HTMLDivElement;
  let containerRef!: HTMLDivElement;
  let modalRef!: HTMLDivElement;
  let last: { x: number; y: number } | null;

  let timeDiff = 0;
  let timestamp = Date.now();

  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, props.locale));
  const DAY_COLS = () => getWeekDays(props.dayCols, { firstDay: props.firstDay }) as IWeekday[];

  const yToTime = (y: number) => yPosToTime(y, props.minHour, props.maxHour, props.colHeight);
  const timeToY = (time: number) => timeToYPos(time, props.minHour, props.maxHour, props.colHeight);
  const readable = (time: number) => readableTime(time, props.locale);

  const slotIdx = (id: string) => store[store.day!].findIndex((s) => s.id === id);
  const getSlot = (id: string) => store[store.day!].find((s) => s.id === id);

  const getOverlappingSlots = (clickTime: number) => findOverlappingSlots(clickTime, clickTime, store[store.day!]);
  const getNearbySlots = (clickTime: number) =>
    findOverlappingSlots(clickTime - props.snapTo, clickTime + props.snapTo, store[store.day!]);

  const getScreenWidth = () => {
    const widths = [window.innerWidth];

    if (window.screen?.width) widths.push(window.screen?.width);

    return Math.min(...widths);
  };

  const getScreenHeight = () => {
    const heights = [window.innerHeight];

    if (window.screen?.height) heights.push(window.screen?.height);

    return Math.min(...heights);
  };

  const updateWidgetBounds = () => {
    setWidgetTop(widgetRef.getBoundingClientRect().top + (document.scrollingElement?.scrollTop || 0));
    setWidgetLeft(widgetRef.getBoundingClientRect().left);
  };
  const updateWidgetWidth = () => {
    const wWidth = () => {
      if (props.widgetHeight + SCROLL_BAR >= props.colHeight + props.headerHeight) {
        return props.colWidth * (props.dayCols.length + 0.5) + 2;
      } else {
        return props.colWidth * (props.dayCols.length + 0.5) + SCROLL_BAR + 2;
      }
    };

    setWidgetWidth(Math.min(wWidth(), getScreenWidth() * 0.96));
  };

  const isModalOpen = () =>
    store.modal.create || store.modal.merge || store.modal.details || store.modal.confirm || store.modal.drop;

  const [widgetWidth, setWidgetWidth] = createSignal(0);
  const [widgetTop, setWidgetTop] = createSignal(0);
  const [widgetLeft, setWidgetLeft] = createSignal(0);

  const [modalTop, setModalTop] = createSignal(0);
  const [modalLeft, setModalLeft] = createSignal(0);
  const [modalHeight, setModalHeight] = createSignal(0);
  const [modalWidth, setModalWidth] = createSignal(0);

  const [store, setStore] = createStore<IStore>(INITIAL_STORE);

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

  const observer = new ResizeObserver(updateWidgetWidth);

  createEffect(() => {
    updateWidgetBounds();
    document.addEventListener("scroll", updateWidgetBounds);
    observer.observe(document.body);
  });

  onCleanup(() => {
    document.removeEventListener("scroll", updateWidgetBounds);
    observer.unobserve(document.body);
  });

  createEffect(() => {
    if (isModalOpen()) {
      setModalTop((p) =>
        store.lastWindowPos.y < getScreenHeight() / 2
          ? store.lastWindowPos.y + (document.scrollingElement?.scrollTop || 0)
          : store.lastWindowPos.y + (document.scrollingElement?.scrollTop || 0) - modalHeight()
      );
      setModalLeft((p) =>
        store.lastWindowPos.x < getScreenWidth() / 2 ? store.lastWindowPos.x : store.lastWindowPos.x - modalWidth()
      );
      setModalHeight(modalRef.getBoundingClientRect().height);
      setModalWidth(modalRef.getBoundingClientRect().width);
    }
  });

  createEffect(() => {
    console.log({
      widgetWidth: widgetWidth(),
      widgetLeft: widgetLeft(),
      widgetTop: widgetTop(),
    });
    // console.log({
    //   modalLeft: modalLeft(),
    //   modalTop: modalTop(),
    //   modalHeight: modalHeight(),
    //   modalWidth: modalWidth(),
    // });
  });

  createEffect(() => {
    props.onChange(store);
  });

  createPointerListeners({
    target: () => containerRef,
    onUp: ({ x, y }) => {
      timeDiff = Date.now() - timestamp;

      setStore("lastWindowPos", { x, y });
      setStore("lastContainerPos", {
        x: x - widgetLeft() - props.colWidth / 2 + widgetRef.scrollLeft,
        y: y - widgetTop() + (document.scrollingElement?.scrollTop || 0) - props.headerHeight + widgetRef.scrollTop,
      });

      if (!isModalOpen() && timeDiff < 300) {
        if (getOverlappingSlots(yToTime(store.lastContainerPos.y)).length) {
          setStore("modal", "details", true);
          return;
        }

        if (getNearbySlots(yToTime(store.lastContainerPos.y)).length) {
          setStore("modal", "merge", true);
          return;
        }
        // setStore("slotId", "");
        setStore("modal", "create", true);
      }
    },
  });

  createPointerListeners({
    target: () => document.body,

    onDown: ({ x, y }) => {
      last = { x, y };
      timestamp = Date.now();
      // console.log({ x, y });
    },
    onUp: ({ x, y }) => {
      setTimeout(() => setStore("gesture", "idle"), 100);
      last = null;

      if (!store.slotId || !store.day || !store[store.day!].length || slotIdx(store.slotId) === -1) return;

      // const overlapping = getOverlappingSlots(yToTime(store.lastContainerPos.y)).filter((s) => s.id !== store.slotId);

      const overlapping = findOverlappingSlots(
        store[store.day!][slotIdx(store.slotId)].start,
        store[store.day!][slotIdx(store.slotId)].end,
        store[store.day].filter((s) => s.id !== store[store.day!][slotIdx(store.slotId!)].id)
      );

      console.log("dropped");
      if (overlapping.length) {
        setStore("modal", "drop", true);
      }

      setStore(store.day!, slotIdx(store.slotId), (slot) => ({
        start: snapTime(slot.start, props.snapTo),
        end: snapTime(slot.end, props.snapTo),
      }));
    },
    onLeave: () => {
      last = null;
    },
    onCancel: () => {
      last = null;
    },
    onMove: ({ x, y }) => {
      if (!last || store.gesture === "idle") return;

      if (store.gesture === "drag:middle") {
        // console.log({ x: last.x, y: last.y });
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            top: timeToY(slot.start) + y - last!.y,
            start: yToTime(timeToY(slot.start) + y - last!.y),
            end: yToTime(timeToY(slot.end - slot.start) + timeToY(slot.start) + y - last!.y),
          };

          if (newSlot.top < 0 || newSlot.end > props.maxHour * 60) return slot;

          return newSlot;
        });
      }

      if (store.gesture === "drag:top") {
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            top: timeToY(slot.start) + y - last!.y,
            height: timeToY(slot.end - slot.start) + (last!.y - y),
            start: yToTime(timeToY(slot.start) + y - last!.y),
            end: slot.end,
          };
          const duration = newSlot.end - newSlot.start;

          if (newSlot.start < 0 || duration < Math.max(MIN_SLOT_DURATION, props.snapTo)) return slot;

          return newSlot;
        });
      }

      if (store.gesture === "drag:bottom") {
        setStore(store.day!, slotIdx(store.slotId!), (slot) => {
          const newSlot = {
            height: timeToY(slot.end - slot.start) + (y - last!.y),
            start: slot.start,
            end: yToTime(timeToY(slot.start) + timeToY(slot.end - slot.start) + (y - last!.y)),
          };
          const duration = newSlot.end - newSlot.start;

          if (newSlot.end > props.maxHour * 60 || duration < Math.max(MIN_SLOT_DURATION, props.snapTo)) return slot;

          return newSlot;
        });
      }

      last = { x, y };
      // console.log(last.y);
    },
  });

  return (
    <div style={{ display: props.open ? "block" : "none" }}>
      <main
        ref={widgetRef}
        class="mx-auto my-0 overflow-auto flex flex-col whitespace-nowrap"
        style={{
          height: `${props.widgetHeight + SCROLL_BAR + 2}px`,
          width: `${widgetWidth()}px`,
          background: `${THEME[props.palette].bg}`,
          color: `${THEME[props.palette].text}`,
        }}
      >
        {/* ********* TOP BAR ********** */}
        <div
          class="sticky inline-flex top-0 z-10 opacity-80 select-none"
          style={{
            height: `${props.headerHeight}px`,
            width: `${(props.dayCols.length + 0.5) * props.colWidth}px`,
            background: `${THEME[props.palette].primary2}`,
          }}
        >
          <div class="inline-flex" style={{ width: `${props.colWidth / 2}px` }}></div>
          <For each={DAY_COLS()}>
            {(day) => (
              <div
                class="border-l-[1px] inline-flex justify-center items-center whitespace-normal overflow-clip"
                style={{ height: `${props.headerHeight}px`, width: `${props.colWidth}px` }}
              >
                {day}
              </div>
            )}
          </For>
        </div>

        {/* *********** COLUMNS WRAPPER ************ */}
        <div
          class="inline-flex"
          style={{
            width: `${(props.dayCols.length + 0.5) * props.colWidth}px`,
          }}
        >
          {/* ********* SIDE BAR ********** */}
          <div
            class="sticky inline-block left-0 z-[5] opacity-80 select-none"
            style={{
              height: `${props.colHeight}px`,
              width: `${props.colWidth / 2}px`,
              background: `${THEME[props.palette].accent2}`,
            }}
          >
            <For each={HOURS()}>
              {(hour) => (
                <div
                  class="relative text-sm border-b-[1px] flex justify-center items-center whitespace-normal overflow-clip"
                  style={{
                    height: `${props.colHeight / HOURS().length}px`,
                  }}
                >
                  <div class="absolute top-0">{hour}</div>
                </div>
              )}
            </For>
          </div>

          {/* ********* TIME GRID ********** */}
          <div
            ref={containerRef}
            class="relative inline-block"
            style={{
              height: `${props.colHeight}px`,
              width: `${props.dayCols.length * props.colWidth}px`,
            }}
          >
            {/* ********* DAY COLS ********** */}
            <For each={DAY_COLS()}>
              {(day, colIdx) => {
                let columnRef!: HTMLDivElement;

                createPerPointerListeners({
                  target: () => columnRef,
                  onEnter(e, { onDown, onUp }) {
                    onDown(({ x, y }) => {
                      setStore("day", day);
                    });
                  },
                });

                return (
                  <div
                    ref={columnRef}
                    class="absolute inline-block z-[2] border-l-[1px]"
                    style={{
                      width: `${props.colWidth - 1}px`,
                      height: `${props.colHeight}px`,
                      left: `${props.colWidth * colIdx()}px`,
                    }}
                  >
                    {/* ********* TIME SLOTS ************ */}

                    <For each={store[day]}>
                      {(slot, idx) => {
                        let slotRef!: HTMLDivElement;
                        let middleRef!: HTMLDivElement;
                        let topRef!: HTMLDivElement;
                        let bottomRef!: HTMLDivElement;

                        // SLOT LISTENER
                        createPointerListeners({
                          target: () => slotRef,
                          onDown: ({ x, y }) => {
                            batch(() => {
                              setStore("slotId", slot.id);
                            });
                          },
                        });

                        // MIDDLE LISTENER
                        createPointerListeners({
                          target: () => middleRef,
                          onDown: (e) => setStore("gesture", "drag:middle"),
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

                        const height = createMemo(() => `${timeToY(slot.end - slot.start)}px`);
                        const top = createMemo(() => `${timeToY(slot.start)}px`);
                        return (
                          /* ********* TIME SLOT ************ */
                          <div id={slot.id} ref={slotRef} class="w-full absolute bg-blue-600" style={{ top: top() }}>
                            <div
                              ref={topRef}
                              class="absolute top-0 w-full h-3 bg-blue-800 opacity-60"
                              style={{ "touch-action": "none" }}
                            ></div>
                            <div
                              ref={middleRef}
                              class="w-full h-[100%] flex flex-col justify-center items-center overflow-clip text-xs"
                              style={{
                                "touch-action": "none",
                                "user-select": "none",
                                height: height(),
                              }}
                            >
                              <p>
                                {readable(slot.start)} - {readable(slot.end)}
                              </p>
                              <p>{store.slotId === slot.id ? store.gesture : "idle"}</p>
                            </div>
                            <div
                              ref={bottomRef}
                              class="absolute bottom-0 w-full h-3 bg-blue-800 opacity-60"
                              style={{ "touch-action": "none" }}
                            ></div>
                          </div>
                        );
                      }}
                    </For>

                    {/* ********* HOUR LINES ********** */}
                    <For each={HOURS()}>
                      {(hour, hourIdx) => (
                        <div
                          class="absolute h-[1px] pointer-events-none z-[-1]"
                          style={{
                            top: `${(props.colHeight / HOURS().length) * hourIdx()}px`,
                            width: `${props.colWidth}px`,
                            background: `${THEME[props.palette].lightText}`,
                          }}
                        ></div>
                      )}
                    </For>
                  </div>
                );
              }}
            </For>

            {/* ************* MODAL *************** */}

            <Portal mount={document.getElementById("root")!}>
              <>
                <div
                  ref={modalRef}
                  class="absolute z-50 p-4 top-0 text-lg"
                  style={{
                    background: `${THEME[props.palette].bg2}`,
                    display: isModalOpen() ? "block" : "none",
                    top: `${modalTop()}px`,
                    left: `${modalLeft()}px`,
                  }}
                >
                  <section style={{ display: store.modal.create ? "block" : "none" }}>
                    <button>
                      <FiX onClick={(e) => setStore("modal", "create", false)} />
                    </button>
                    <p>Create</p>
                    <button
                      onClick={(e) => {
                        const newSlot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                        setStore(store.day!, (slots) => [...slots, newSlot]);
                        setStore("modal", "create", false);
                      }}
                    >
                      <FaSolidCalendarPlus />
                    </button>
                  </section>

                  <section style={{ display: store.modal.merge ? "block" : "none" }}>
                    <button>
                      <FiX onClick={(e) => setStore("modal", "merge", false)} />
                    </button>
                    <p>Merge</p>
                    <button
                      onClick={(e) => {
                        const slot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                        const { mergedSlots, newSlot } = getMergedTimeslots(slot, store[store.day!]);

                        setStore(store.day!, mergedSlots);
                        setStore("slotId", newSlot.id);
                        setStore("modal", "merge", false);
                      }}
                    >
                      <FiLayers />
                    </button>
                    <button
                      onClick={(e) => {
                        const newSlot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                        setStore(store.day!, (slots) => [...slots, newSlot]);
                        setStore("modal", "merge", false);
                      }}
                    >
                      <FaSolidCalendarPlus />
                    </button>
                  </section>

                  <section style={{ display: store.modal.drop ? "block" : "none" }}>
                    <button>
                      <FiX onClick={(e) => setStore("modal", "drop", false)} />
                    </button>
                    <p>Drop</p>
                    <button
                      onClick={(e) => {
                        const slot = createNewTimeSlot(store.day!, yToTime(store.lastContainerPos.y));
                        const { mergedSlots, newSlot } = getMergedTimeslots(slot, store[store.day!]);

                        setStore(store.day!, mergedSlots);
                        setStore("slotId", newSlot.id);
                        setStore("modal", "drop", false);
                      }}
                    >
                      <FiLayers />
                      {/* <FiPlus /> */}
                    </button>
                  </section>

                  <section style={{ display: store.modal.details ? "block" : "none" }}>
                    <button>
                      <FiX onClick={(e) => setStore("modal", "details", false)} />
                    </button>

                    <p>Details</p>

                    <p class="text-xs">{store.slotId}</p>

                    <button onClick={(e) => setStore("modal", "details", false)}>
                      <FiCheck />
                    </button>
                    <button
                      onClick={(e) => {
                        setStore("modal", "details", false);
                        setStore(store.day!, (slots) => slots.filter((s) => s.id !== store.slotId));
                      }}
                    >
                      <FiTrash />
                    </button>
                  </section>
                </div>

                {/* ************* OVERLAY ***************  */}

                <div
                  class="fixed z-30 w-[10000px] h-[10000px] opacity-10 bg-fuchsia-800"
                  style={{
                    display: isModalOpen() ? "block" : "none",
                  }}
                  onPointerUp={(e) => {
                    batch(() => {
                      MODAL_TYPES.forEach((type) => setStore("modal", type as any, false));
                    });
                  }}
                ></div>
              </>
            </Portal>
          </div>
        </div>
      </main>
    </div>
  );
}
