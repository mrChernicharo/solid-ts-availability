import { createStore } from "solid-js/store";
import { INITIAL_STORE } from "./lib/constants";
import { IStore } from "./lib/types";

const [store, setStore] = createStore<IStore>(INITIAL_STORE);

export { store, setStore };
