class ArrayList<T> {
  private elements: T[];

  constructor(elements?: T[]) {
    this.elements = elements || [];
  }

  // Add an element to the end of the list
  add(element: T): void {
    this.elements.push(element);
  }

  // Get the element at the specified index
  get(index: number): T {
    if (index < 0 || index >= this.elements.length) {
      throw new Error('Index out of bounds');
    }
    return this.elements[index];
  }

  // Remove the element at the specified index
  remove(index: number): void {
    if (index < 0 || index >= this.elements.length) {
      throw new Error('Index out of bounds');
    }
    this.elements.splice(index, 1);
  }

  // Get the size of the list
  size(): number {
    return this.elements.length;
  }

  // Check if the list is empty
  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  // Clear all elements from the list
  clear(): void {
    this.elements = [];
  }

  // Convert the list to an array
  toArray(): T[] {
    return [...this.elements];
  }

  // Find the index of an element in the list (-1 if not found)
  indexOf(element: T): number {
    return this.elements.indexOf(element);
  }

  // Check if the list contains an element
  contains(element: T): boolean {
    return this.elements.includes(element);
  }

  // Execute a function for each element in the list
  forEach(callback: (element: T, index: number) => void): void {
    for (let i = 0; i < this.elements.length; i++) {
      callback(this.elements[i], i);
    }
  }

  // Create a new list with the results of calling a function on every element in the list
  map<U>(callback: (element: T, index: number) => U): ArrayList<U> {
    const result = new ArrayList<U>();
    for (let i = 0; i < this.elements.length; i++) {
      result.add(callback(this.elements[i], i));
    }
    return result;
  }

  // Create a new list with all elements that pass the test implemented by the provided function
  filter(callback: (element: T, index: number) => boolean): ArrayList<T> {
    const result = new ArrayList<T>();
    for (let i = 0; i < this.elements.length; i++) {
      if (callback(this.elements[i], i)) {
        result.add(this.elements[i]);
      }
    }
    return result;
  }

  // Find the first element that satisfies the provided testing function
  find(callback: (element: T, index: number) => boolean): T | undefined {
    for (let i = 0; i < this.elements.length; i++) {
      if (callback(this.elements[i], i)) {
        return this.elements[i];
      }
    }
    return undefined;
  }

  // Apply a function against an accumulator and each element to reduce it to a single value
  reduce<U>(
    callback: (accumulator: U, element: T, index: number) => U,
    initialValue: U
  ): U {
    let accumulator = initialValue;
    for (let i = 0; i < this.elements.length; i++) {
      accumulator = callback(accumulator, this.elements[i], i);
    }
    return accumulator;
  }

  // Test whether at least one element in the list passes the provided function
  some(callback: (element: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.elements.length; i++) {
      if (callback(this.elements[i], i)) {
        return true;
      }
    }
    return false;
  }

  // Test whether all elements in the list pass the provided function
  every(callback: (element: T, index: number) => boolean): boolean {
    for (let i = 0; i < this.elements.length; i++) {
      if (!callback(this.elements[i], i)) {
        return false;
      }
    }
    return true;
  }
}

export default ArrayList;
