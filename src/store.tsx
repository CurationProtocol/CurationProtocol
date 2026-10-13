import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { applyStake, initialState, type DemoState, type StakeAction } from "./model";

const KEY = "curation-protocol-demo-v2";

export type Action =
  | { type: "connect" }
  | { type: "disconnect" }
  | { type: "reset" }
  | ({ type: "stake" } & StakeAction);

function load(): DemoState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    const data = JSON.parse(raw) as DemoState;
    if (data.version !== 1 || !Array.isArray(data.locks) || !data.you) return initialState();
    if (data.locks.some((lock) => typeof lock.reputation !== "number" || typeof lock.amount !== "number")) {
      return initialState();
    }
    return data;
  } catch {
    return initialState();
  }
}

function reducer(state: DemoState, action: Action): DemoState {
  switch (action.type) {
    case "connect":
      return { ...state, connected: true };
    case "disconnect":
      return { ...state, connected: false };
    case "reset":
      return { ...initialState(), connected: state.connected };
    case "stake": {
      const result = applyStake(state, action);
      return result.ok ? result.state : state;
    }
    default:
      return state;
  }
}

const Ctx = createContext<{ state: DemoState; dispatch: Dispatch<Action> } | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDemo must be used inside the provider");
  return value;
}
