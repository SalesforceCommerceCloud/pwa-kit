interface Storage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

export class MemoryStorage implements Storage {
  _data: Map<string, any>;
  constructor() {
    this._data = new Map();
  }
  setItem(key: string, value: string) {
    this._data.set(key, value);
  }
  getItem(key: string) {
    return this._data.get(key);
  }
  removeItem(key: string) {
    this._data.delete(key);
  }
}
