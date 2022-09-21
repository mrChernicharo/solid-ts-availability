import { createStore } from "solid-js/store";
import { INITIAL_STORE } from "./constants";
import { IStore } from "./types";

const [store, setStore] = createStore<IStore>(INITIAL_STORE);

export { store, setStore };
