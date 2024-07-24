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

    let encoded = localStorage.getItem(key) ?? undefined;
    let value;

    const parsed = validator.safeParse(encoded);
    if (parsed.success) {
      value = parsed.data;
    } else {
      console.error(`Error parsing ${key}`, parsed.error.format());
      encoded = undefined;
      value = validator.parse(undefined);
    }

    this._e = encoded;
    this._v = value;

    const loadFromStorage = () => {
      const encoded = localStorage.getItem(key) ?? undefined;
      if (this._e === encoded) return;

      const parsed = validator.safeParse(encoded);
      if (parsed.success) {
        this._v = parsed.data;
        this._e = encoded;
      } else {
        console.error(`Error parsing ${key}`, parsed.error.format());
        if (this._e !== undefined) {
          this._v = validator.parse(undefined);
          this._e = undefined;
        }
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
