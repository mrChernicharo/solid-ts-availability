import { Component, createEffect, createMemo, createSignal, For, Show } from "solid-js";
import { SCROLL_BAR, THEME } from "./lib/constants";
import { IWeekday, IPalette } from "./lib/types";
import { getLocaleHours } from "./lib/utils";

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
  let containerRef!: HTMLDivElement;
  const HOURS = createMemo(() => getLocaleHours(props.minHour, props.maxHour, props.locale));

  const [widgetWidth, setWidgetWidth] = createSignal("0px");

  createEffect(() => {
    const observer = new ResizeObserver((e) => {
      console.log(e);
      const w = () => {
        if (props.widgetHeight + SCROLL_BAR >= props.colHeight + props.headerHeight) {
          return props.colWidth * (props.dayCols.length + 0.5) + 2;
        } else {
          return props.colWidth * (props.dayCols.length + 0.5) + SCROLL_BAR + 2;
        }
      };

      setWidgetWidth(Math.min(w(), window.innerWidth * 0.96) + "px");
    });

    observer.observe(document.body);
  });

  return (
    <Show when={props.open}>
      <main
        ref={containerRef}
        class="mx-auto my-0 overflow-auto flex flex-col whitespace-nowrap"
        style={{
          height: `${props.widgetHeight + SCROLL_BAR + 2}px`,
          width: widgetWidth(),
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
          <For each={props.dayCols}>
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
            class="relative inline-block"
            style={{
              height: `${props.colHeight}px`,
              width: `${props.dayCols.length * props.colWidth}px`,
            }}
          >
            {/* ********* DAY COLS ********** */}
            <For each={props.dayCols}>
              {(col, colIdx) => (
                <div
                  class="absolute inline-block z-[2] border-l-[1px]"
                  style={{
                    width: `${props.colWidth - 1}px`,
                    height: `${props.colHeight}px`,
                    left: `${props.colWidth * colIdx()}px`,
                  }}
                >
                  {/* ********* HOUR LINES ********** */}
                  <For each={HOURS()}>
                    {(hour, hourIdx) => (
                      <div
                        class="absolute h-[1px]"
                        style={{
                          top: `${(props.colHeight / HOURS().length) * hourIdx()}px`,
                          width: `${props.colWidth}px`,
                          background: `${THEME[props.palette].lightText}`,
                        }}
                      ></div>
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>
      </main>
    </Show>
  );
}
