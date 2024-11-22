type Data<T> = {
  value: T;
  expireTime: number;
};

class HashMap<T> {
  private map: Record<string, Data<T>> = {};

  put(key: string, value: T, milisecond = 1000 * 60 * 3): void {
    this.map[key] = {
      value,
      expireTime: new Date().getTime() + milisecond,
    };
  }

  get(key: string): T | null {
    const entry = this.map[key];
    if (entry === undefined) return null;
    if (new Date().getTime() > entry.expireTime) {
      this.remove(key);
      return null;
    }

    return entry.value;
  }

  remove(key: string): void {
    delete this.map[key];
  }

  containsKey(key: string): boolean {
    const entry = this.map[key];
    if (entry === undefined) return false;
    if (new Date().getTime() > entry.expireTime) {
      this.remove(key);
      return false;
    } else {
      return true;
    }
  }

  size(): number {
    return this.keys().length;
  }

  clear(): void {
    this.map = {};
  }

  keys(): string[] {
    const keys: string[] = [];
    Object.keys(this.map).forEach((key: string) => {
      if (this.containsKey(key)) {
        keys.push(key);
      }
    });
    return keys;
  }

  values(): T[] {
    const values: T[] = [];
    this.keys().forEach((key: string) => {
      values.push(this.map[key].value);
    });
    return values;
  }
}

export default HashMap;
