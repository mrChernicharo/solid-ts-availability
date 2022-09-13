import { createPerPointerListeners, createPointerListeners } from "@solid-primitives/pointer";
import { batch, Component, createEffect, createMemo, createSignal, For, Match, onMount, Show, Switch } from "solid-js";
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
import { FiCalendar, FiCheck, FiDelete, FiLayers, FiPlus, FiX } from "solid-icons/fi";
import { FaSolidCalendarPlus } from "solid-icons/fa";
import {
  findOverlappingSlots,
  getLocaleHours,
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
  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, props.locale));
  const yToTime = (y: number) => yPosToTime(y, props.minHour, props.maxHour, props.colHeight);
  const timeToY = (time: number) => timeToYPos(time, props.minHour, props.maxHour, props.colHeight);

  const readable = (time: number) => readableTime(time, props.locale);
  const slotIdx = (id: string) => store[store.day!].findIndex((s) => s.id === id);
  const getOverlappingSlots = (clickTime: number) => findOverlappingSlots(clickTime, clickTime, store[store.day!]);
  const getNearbySlots = (clickTime: number) =>
    findOverlappingSlots(clickTime - props.snapTo, clickTime + props.snapTo, store[store.day!]);

  const isModalOpen = () =>
    store.modal.create || store.modal.merge || store.modal.details || store.modal.confirm || store.modal.drop;

  const DAY_COLS = () =>
    getWeekDays(props.dayCols, {
      firstDay: props.firstDay,
    }) as IWeekday[];

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

  const [widgetWidth, setWidgetWidth] = createSignal(props.colWidth * (props.dayCols.length + 0.5));
  const [widgetTop, setWidgetTop] = createSignal(0);
  const [widgetLeft, setWidgetLeft] = createSignal(0);

  const [store, setStore] = createStore<IStore>(INITIAL_STORE);

  createEffect(() => {
    const observer = new ResizeObserver((e) => {
      console.log(e);
      const width = () => {
        if (props.widgetHeight + SCROLL_BAR >= props.colHeight + props.headerHeight) {
          return props.colWidth * (props.dayCols.length + 0.5) + 2;
        } else {
          return props.colWidth * (props.dayCols.length + 0.5) + SCROLL_BAR + 2;
        }
      };

      setWidgetWidth(Math.min(width(), window.innerWidth * 0.96));
      setWidgetTop(widgetRef.getBoundingClientRect().top);
      setWidgetLeft(widgetRef.getBoundingClientRect().left);
    });

    observer.observe(document.body);
  });

  createEffect(() => {
    console.log({ l: widgetLeft(), t: widgetTop() });
  });

  createEffect(() => {
    props.onChange(store);
  });

  createPointerListeners({
    target: () => containerRef,
    onUp: ({ x, y }) => {
      console.log("clicked", store.day);
      if (store.gesture === "idle") setStore("modal", "create", true);
      setStore("lastClickPos", { x, y });
      setStore("lastContainerPos", {
        x: x - widgetLeft() - props.colWidth / 2,
        y: y - widgetTop() - props.headerHeight,
      });
    },
  });

  createPerPointerListeners({
    target: () => document.body,
    onEnter(e, { onDown, onMove, onUp, onLeave, onCancel }) {
      let last: { x: number; y: number } | null;
      // console.log("entered");

      onDown(({ x, y }) => {
        last = { x, y };
        console.log({ x, y });
      });
      onUp(({ x, y }) => {
        last = null;

        setTimeout(() => setStore("gesture", "idle"), 100);

        if (!store.slotId || !store.day || !store[store.day!].length) return;

        setStore(store.day!, slotIdx(store.slotId), (slot) => ({
          start: snapTime(slot.start, props.snapTo),
          end: snapTime(slot.end, props.snapTo),
        }));
      });
      onLeave(() => {
        last = null;
        // console.log("left");
      });
      onCancel(() => {
        last = null;
      });
      onMove(({ x, y }) => {
        if (!last || store.gesture === "idle") {
          // console.log("skip");
          return;
        }

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
      });
    },
  });

  return (
    <Show when={props.open}>
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
                  class="text-sm border-b-[1px]"
                  style={{
                    height: `${props.colHeight / HOURS().length}px`,
                  }}
                >
                  {hour}
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
            // onClick={(e) => {

            // }}
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
                    onUp(() => {
                      // setTimeout(() => setStore("day", null), 100);
                      // console.log("clicked", store.day);
                      // if (store.gesture === "idle") setStore("modal", "create", true);
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
                          <div
                            id={slot.id}
                            ref={slotRef}
                            class="w-full absolute bg-blue-600"
                            style={{ top: top() }}
                            onClick={(e) => {
                              if (!store.modal.merge && !store.modal.drop) setStore("modal", "details", true);
                            }}
                          >
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
              <div
                class="absolute z-50 p-4 top-0 text-lg"
                style={{
                  background: `${THEME[props.palette].bg2}`,
                  display: isModalOpen() ? "block" : "none",
                  top: `${store.lastClickPos.y}px`,
                  left: `${store.lastClickPos.x}px`,
                }}
              >
                <section style={{ display: store.modal.create ? "block" : "none" }}>
                  <button>
                    <FiX onClick={(e) => setStore("modal", "create", false)} />
                  </button>
                  <p>Create</p>
                  <button
                    onClick={(e) => {
                      const newSlot = createNewTimeSlot(
                        store.day!,
                        yToTime(store.lastContainerPos.y + widgetRef.scrollTop)
                      );
                      setStore(store.day!, (slots) => [...slots, newSlot]);
                      setStore("modal", "create", false);
                    }}
                  >
                    <FaSolidCalendarPlus />
                    {/* <FiPlus /> */}
                  </button>
                </section>

                <section style={{ display: store.modal.merge ? "block" : "none" }}>
                  <button>
                    <FiX onClick={(e) => setStore("modal", "merge", false)} />
                  </button>
                  <p>Merge</p>
                  <button
                    onClick={(e) => {
                      console.log("merge that shit!");
                      // const newSlot = createNewTimeSlot(
                      //   store.day!,
                      //   yToTime(store.lastContainerPos.y + widgetRef.scrollTop)
                      // );
                      // setStore(store.day!, (slots) => [...slots, newSlot]);
                      setStore("modal", "merge", false);
                    }}
                  >
                    <FiLayers />
                  </button>
                </section>

                <section style={{ display: store.modal.drop ? "block" : "none" }}>
                  <button>
                    <FiX onClick={(e) => setStore("modal", "drop", false)} />
                  </button>
                  <p>Drop</p>
                  <button
                    onClick={(e) => {
                      // const newSlot = createNewTimeSlot(
                      //   store.day!,
                      //   yToTime(store.lastContainerPos.y + widgetRef.scrollTop)
                      // );
                      // setStore(store.day!, (slots) => [...slots, newSlot]);
                      setStore("modal", "drop", false);
                    }}
                  >
                    <FaSolidCalendarPlus />
                    {/* <FiPlus /> */}
                  </button>
                </section>

                <section style={{ display: store.modal.details ? "block" : "none" }}>
                  <button>
                    <FiX onClick={(e) => setStore("modal", "details", false)} />
                  </button>

                  <p>Details</p>

                  <button onClick={(e) => setStore("modal", "details", false)}>
                    <FiCheck />
                  </button>
                  <button
                    onClick={(e) => {
                      setStore("modal", "details", false);
                      setStore(store.day!, (slots) => slots.filter((s) => s.id !== store.slotId));
                    }}
                  >
                    <FiDelete />
                  </button>
                </section>

                {/* {Object.keys(store.modal).filter((k) => store.modal[k])} */}
              </div>

              {/* ************* OVERLAY *************** */}

              <div
                class="fixed z-30 w-[10000px] h-[10000px] opacity-10 bg-fuchsia-800"
                style={{
                  display: isModalOpen() ? "block" : "none",
                }}
                onClick={(e) => {
                  batch(() => {
                    MODAL_TYPES.forEach((type) => setStore("modal", type as any, false));
                  });
                }}
              ></div>
            </Portal>
          </div>
        </div>
      </main>
    </Show>
  );
}
