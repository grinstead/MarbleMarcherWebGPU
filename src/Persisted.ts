import { createSignal, onCleanup } from "solid-js";
import { ZodSchema, ZodTypeDef } from "zod";

export class Persisted<T> extends EventTarget {
  private _e: undefined | string;
  private _v: T;

  constructor(
    readonly key: string,
    readonly validator: ZodSchema<T, ZodTypeDef, string | undefined>,
    readonly encoder: (value: Exclude<NoInfer<T>, undefined>) => string
  ) {
    super();

    const encoded = localStorage.getItem(key) ?? undefined;
    this._v = validator.parse(encoded);
    this._e = encoded;

    const loadFromStorage = () => {
      const encoded = localStorage.getItem(key) ?? undefined;
      if (this._e === encoded) return;

      if (this._e) {
        this._v = validator.parse(encoded);
        this._e = encoded;
      }
    };

    addEventListener("storage", loadFromStorage);
  }

  set(value: undefined | T) {
    if (value === this._v) return;

    const { key, encoder } = this;

    const encoded =
      value !== undefined ? encoder(value as Exclude<T, undefined>) : undefined;

    const parsed = this.validator.parse(encoded);

    this._e = encoded;
    this._v = parsed;

    if (encoded === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, encoded);
    }

    this.dispatchEvent(new Event("change"));
  }

  get(): T {
    return this._v;
  }
}

export function usePersisted<T>(persisted: Persisted<T>) {
  const [value, setValue] = createSignal<T>(persisted.get());

  persisted.addEventListener("change", listener);
  onCleanup(() => {
    persisted.removeEventListener("change", listener);
  });

  return value;

  function listener() {
    const value = persisted.get();
    setValue(
      typeof value === "function"
        ? () => value
        : (value as Exclude<T, Function>)
    );
  }
}
