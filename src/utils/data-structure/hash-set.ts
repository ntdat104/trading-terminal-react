class HashSet<T> {
  private set: Record<string, T> = {};

  private getKey(value: T): string {
    return JSON.stringify(value);
  }

  add(value: T): void {
    const key = this.getKey(value);
    this.set[key] = value;
  }

  remove(value: T): void {
    const key = this.getKey(value);
    delete this.set[key];
  }

  contains(value: T): boolean {
    const key = this.getKey(value);
    const entry = this.set[key];
    if (entry !== undefined) {
      return true;
    } else {
      return false;
    }
  }

  size(): number {
    return Object.keys(this.set).length;
  }

  clear(): void {
    this.set = {};
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  toArray(): T[] {
    return Object.values(this.set);
  }
}

export default HashSet;
