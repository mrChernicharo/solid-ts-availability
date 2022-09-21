import { Component, createMemo, createSignal, For } from "solid-js";
import AvailabilityWidget from "./AvailabilityWidget";
import { SNAP_OPTIONS, THEME, WEEKDAYS } from "./lib/constants";
import { getObjWithOmittedProps } from "./lib/utils";
import { IPalette, IWeekday } from "./lib/types";
import WidgetLayout from "./WidgetLayout";
import Layout2 from "./Layout2";

const App: Component = () => {
  const [isOpen, setIsOpen] = createSignal(true);

  const [palette, setPalette] = createSignal<IPalette>("dark");
  const [colHeight, setColHeight] = createSignal(1000);
  const [colWidth, setColWidth] = createSignal(100);
  const [widgetHeight, setWidgetHeight] = createSignal(500);
  const [headerHeight, setHeaderHeight] = createSignal(50);
  const [firstDay, setFirstDay] = createSignal<IWeekday>("Mon");
  const [minHour, setMinHour] = createSignal(9);
  const [endHour, setEndHour] = createSignal(18);
  const [snap, setSnap] = createSignal(15);
  const [cols, setCols] = createSignal(WEEKDAYS);
  const [locale, setLocale] = createSignal("pt-BR");

  const [value, setValue] = createSignal({});

  const inputStyle = createMemo(() => ({ color: THEME[palette()].text2, background: THEME[palette()].bg2 }));

  return (
    <div>
      <h1 class="text-center text-4xl">Availability Widget</h1>
      <section class="controls" style={{ "text-align": "center" }}>
        <div>
          <div>
            <button
              class="p-2 border"
              data-cy="palette_btn"
              onClick={(e) => setPalette(palette() === "light" ? "dark" : "light")}
            >
              {palette() === "light" ? "Dark" : "Light"} mode
            </button>
            palette: {palette()}
          </div>
          <div>
            <button class="p-2 border" data-cy="open_btn" onClick={(e) => setIsOpen(!isOpen())}>
              {isOpen() ? "Close" : "Open"}
            </button>
            open: {isOpen() ? "true" : "false"}
          </div>
        </div>

        <div>
          <label for="locale">locale</label>
          <select
            id="locale"
            value={locale()}
            style={{ ...inputStyle() }}
            onChange={(e) => setLocale(e.currentTarget.value)}
          >
            <For each={["en", "pt-BR", "de", "it", "fr", "jpn"]}>{(locale) => <option>{locale}</option>}</For>
          </select>

          <label for="first_day">first_day</label>
          <select
            id="first_day"
            value={firstDay()}
            style={{ ...inputStyle() }}
            onChange={(e) => setFirstDay(e.currentTarget.value as IWeekday)}
          >
            <For each={WEEKDAYS}>{(day) => <option>{day}</option>}</For>
          </select>

          <label for="snap">snap</label>
          <select
            id="snap"
            value={snap()}
            style={{ ...inputStyle() }}
            onChange={(e) => setSnap(+e.currentTarget.value)}
          >
            <For each={SNAP_OPTIONS}>{(snap) => <option>{snap}</option>}</For>
          </select>
        </div>

        <div>
          <For each={WEEKDAYS}>
            {(day, i) => (
              <>
                <input
                  id={`col_checkbox_${day}`}
                  type="checkbox"
                  checked={cols().indexOf(day) !== -1}
                  onchange={(e) => {
                    let newCols = [...cols()];
                    let dayIdx = cols().indexOf(day);
                    if (dayIdx === -1) {
                      setCols([...newCols, day]);
                    }
                    if (dayIdx >= 0) {
                      newCols.splice(dayIdx, 1);
                      setCols(newCols);
                    }
                  }}
                />
                <label for={`col_checkbox_${day}`}>{day}</label>
              </>
            )}
          </For>
        </div>

        <label for="start_hour">Start Hour</label>
        <input
          id="start_hour"
          type="number"
          style={{ width: "60px", ...inputStyle() }}
          value={minHour()}
          onChange={(e) => {
            setMinHour(+e.currentTarget.value);
          }}
        />

        <label for="end_hour">End Hour</label>
        <input
          id="end_hour"
          type="number"
          style={{ width: "60px", ...inputStyle() }}
          value={endHour()}
          onChange={(e) => setEndHour(+e.currentTarget.value)}
        />

        <div>
          <label for="col_height">col_height</label>
          <input
            id="col_height"
            type="number"
            style={{ width: "60px", ...inputStyle() }}
            value={colHeight()}
            onChange={(e) => setColHeight(+e.currentTarget.value)}
          />

          <label for="widget_height">widget_height</label>
          <input
            id="widget_height"
            type="number"
            style={{ width: "60px", ...inputStyle() }}
            value={widgetHeight()}
            onChange={(e) => setWidgetHeight(+e.currentTarget.value)}
          />

          <label for="header_height">header_height</label>
          <input
            id="header_height"
            type="number"
            style={{ width: "60px", ...inputStyle() }}
            value={headerHeight()}
            onChange={(e) => setHeaderHeight(+e.currentTarget.value)}
          />

          <label for="col_width">col_width</label>
          <input
            id="col_width"
            type="number"
            style={{ width: "60px", ...inputStyle() }}
            value={colWidth()}
            onChange={(e) => setColWidth(+e.currentTarget.value)}
          />
        </div>
      </section>
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <br />
      <Layout2
        locale={locale()}
        dayCols={cols()} // omit days if you want, order doesn't matter, repeated items don't matter
        firstDay={firstDay()} // first dayColumn
        palette={palette()} // light | dark
        open={isOpen()}
        minHour={minHour()}
        maxHour={endHour()}
        widgetHeight={widgetHeight()}
        headerHeight={headerHeight()}
        colHeight={colHeight()}
        colWidth={colWidth()}
        sideBarWidth={80}
        snapTo={snap()}
        onChange={(val: any) => setValue(val)}
      />
      <br />
      <br />
      {/* <AvailabilityWidget
        locale={locale()}
        dayCols={cols()} // omit days if you want, order doesn't matter, repeated items don't matter
        firstDay={firstDay()} // first dayColumn
        palette={palette()} // light | dark
        open={isOpen()}
        minHour={minHour()}
        maxHour={endHour()}
        widgetHeight={widgetHeight()}
        headerHeight={headerHeight()}
        colHeight={colHeight()}
        colWidth={colWidth()}
        snapTo={snap()}
        onChange={(val: any) => setValue(val)}
      /> */}
      <br />
      <br />
      {/* <WidgetLayout /> */}
      {/* <pre class="text-xs">
        {JSON.stringify(getObjWithOmittedProps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]), null, 2)}
      </pre> */}
      <pre class="text-xs">{JSON.stringify(value(), null, 2)}</pre>
    </div>
  );
};

export default App;
