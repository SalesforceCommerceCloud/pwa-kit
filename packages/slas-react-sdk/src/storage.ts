export interface Storage {
  set: (key: string, value: any, options: any) => void;
  get: (key: string) => any;
  delete: (key: string) => void;
}

export class LocalStorage implements Storage {
  constructor() {
    if (typeof window === "undefined") {
      throw new Error(
        "LocalStorage is not avaliable on the current environment."
      );
    }
  }
  set(key: string, value: string) {
    window.localStorage.setItem(key, value);
  }
  get(key: string) {
    return window.localStorage.getItem(key);
  }
  delete(key: string) {
    window.localStorage.removeItem(key);
  }
}
