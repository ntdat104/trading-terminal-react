class Queue<T> {
  private elements: T[] = [];

  // Adds an element to the end of the queue
  enqueue(element: T): void {
    this.elements.push(element);
  }

  // Removes and returns the front element of the queue
  dequeue(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.elements.shift();
  }

  // Returns the front element of the queue without removing it
  front(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.elements[0];
  }

  // Checks if the queue is empty
  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  // Returns the size of the queue
  size(): number {
    return this.elements.length;
  }

  // Clears the queue
  clear(): void {
    this.elements = [];
  }

  // Returns the elements of the queue
  toArray(): T[] {
    return this.elements;
  }
}

export default Queue;
