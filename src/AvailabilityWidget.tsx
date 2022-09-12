import { createPerPointerListeners } from "@solid-primitives/pointer";
import { batch, Component, createEffect, createMemo, createSignal, For, onMount, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { DEFAULT_SLOT_DURATION, MIN_SLOT_DURATION, SCROLL_BAR, THEME } from "./lib/constants";
import { IWeekday, IPalette, IStore } from "./lib/types";
import { getLocaleHours, getWeekDays, readableTime, yPosToTime } from "./lib/utils";
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
  const yTime = (y: number) => yPosToTime(y, props.minHour, props.maxHour, props.colHeight);
  const readable = (time: number) => readableTime(time, props.locale);

  const DAY_COLS = () =>
    getWeekDays(props.dayCols, {
      firstDay: props.firstDay,
    }) as IWeekday[];

  const [widgetWidth, setWidgetWidth] = createSignal(props.colWidth * (props.dayCols.length + 0.5));
  const [widgetTop, setWidgetTop] = createSignal(0);

  const [store, setStore] = createStore<IStore>({
    day: null,
    slotId: null,
    slotIdx: null,
    gesture: "idle",
    Sun: [],
    Mon: [
      {
        id: idMaker(),
        start: props.minHour * 60,
        end: props.minHour * 60 + 60,
        height: props.colHeight / (props.maxHour - props.minHour), // 1 hour
        top: 0,
      },
    ],
    Tue: [],
    Wed: [
      {
        id: idMaker(),
        start: props.minHour + 1 * 60,
        end: props.minHour + 3 * 60,
        height: (props.colHeight / (props.maxHour - props.minHour)) * 2, // 2 hours
        top: props.colHeight / (props.maxHour - props.minHour),
      },
    ],
    Thu: [],
    Fri: [],
    Sat: [],
  });

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
    });

    observer.observe(document.body);
  });

  createEffect(() => {
    props.onChange(store);
  });

  createPerPointerListeners({
    target: () => document.body,
    onEnter(e, { onDown, onMove, onUp, onLeave }) {
      let last: { x: number; y: number } | null;
      onDown(({ x, y }) => {
        last = { x, y };
      });
      onUp(() => {
        last = null;
        setStore("gesture", "idle");
        console.log("dropped", store.slotId);
      });
      onLeave(() => {
        last = null;
      });
      onMove(({ x, y }) => {
        if (!last) return;

        if (store.gesture === "drag:middle") {
          // console.log({ x: last.x, y: last.y });

          setStore(store.day!, store.slotIdx!, (slot) => {
            const newSlot = {
              top: slot.top + y - last!.y,
              start: yTime(slot.top + y - last!.y),
              end: yTime(slot.height + slot.top + y - last!.y),
            };

            if (newSlot.top < 0 || newSlot.end > props.maxHour * 60) return slot;

            return newSlot;
          });
        }

        if (store.gesture === "drag:top") {
          setStore(store.day!, store.slotIdx!, (slot) => {
            const newSlot = {
              top: slot.top + y - last!.y,
              height: slot.height + (last!.y - y),
              start: yTime(slot.top + y - last!.y),
              end: slot.end,
            };
            const duration = newSlot.end - newSlot.start;

            if (newSlot.start < 0 || duration < MIN_SLOT_DURATION) return slot;

            return newSlot;
          });
        }

        if (store.gesture === "drag:bottom") {
          setStore(store.day!, store.slotIdx!, (slot) => {
            const newSlot = {
              height: slot.height + (y - last!.y),
              start: slot.start,
              end: yTime(slot.top + slot.height + (y - last!.y)),
            };
            const duration = newSlot.end - newSlot.start;

            if (newSlot.end > props.maxHour * 60 || duration < MIN_SLOT_DURATION) return slot;

            return newSlot;
          });
        }

        last = { x, y };
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
            {(col) => (
              <div
                class="border-l-[1px] inline-flex justify-center items-center whitespace-normal overflow-clip"
                style={{ height: `${props.headerHeight}px`, width: `${props.colWidth}px` }}
              >
                {col}
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
                      setStore("day", null);
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
                        createPerPointerListeners({
                          target: () => slotRef,
                          onEnter(e, { onDown, onMove, onUp, onLeave }) {
                            onDown(({ x, y }) => {
                              batch(() => {
                                setStore("slotId", slot.id);
                                setStore("slotIdx", idx());
                              });
                            });
                          },
                        });

                        // MIDDLE LISTENER
                        createPerPointerListeners({
                          target: () => middleRef,
                          onEnter(e, { onDown, onMove, onUp, onLeave }) {
                            onDown(({ x, y }) => {
                              setStore("gesture", "drag:middle");
                            });
                          },
                        });

                        // TOP LISTENER
                        createPerPointerListeners({
                          target: () => topRef,
                          onEnter(e, { onDown, onMove, onUp, onLeave }) {
                            onDown(({ x, y }) => {
                              setStore("gesture", "drag:top");
                            });
                          },
                        });

                        // BOTTOM LISTENER
                        createPerPointerListeners({
                          target: () => bottomRef,
                          onEnter(e, { onDown, onMove, onUp, onLeave }) {
                            onDown(({ x, y }) => {
                              setStore("gesture", "drag:bottom");
                            });
                          },
                        });

                        const height = createMemo(() => `${slot.height}px`);
                        const top = createMemo(() => `${slot.top}px`);
                        return (
                          /* ********* TIME SLOT ************ */
                          <div
                            id={slot.id}
                            ref={slotRef}
                            class="w-full absolute bg-blue-600"
                            style={{
                              top: top(),
                              // height: height(),
                            }}
                          >
                            <div
                              ref={topRef}
                              class="absolute top-0 w-full h-3 bg-slate-500"
                              style={{
                                "touch-action": "none",
                              }}
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
                              {/* <p>{slot.id}</p> */}
                              <p>
                                {readable(slot.start)} - {readable(slot.end)}
                              </p>
                              <p>{store.slotId === slot.id ? store.gesture : "idle"}</p>
                            </div>
                            <div
                              ref={bottomRef}
                              class="absolute bottom-0 w-full h-3 bg-slate-500"
                              style={{
                                "touch-action": "none",
                              }}
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
          </div>
        </div>
      </main>
    </Show>
  );
}
