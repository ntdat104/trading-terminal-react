class Stack<T> {
  private elements: T[] = [];

  // Pushes an element onto the stack
  push(element: T): void {
    this.elements.push(element);
  }

  // Removes and returns the top element of the stack
  pop(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.elements.pop();
  }

  // Returns the top element of the stack without removing it
  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.elements[this.elements.length - 1];
  }

  // Checks if the stack is empty
  isEmpty(): boolean {
    return this.elements.length === 0;
  }

  // Returns the size of the stack
  size(): number {
    return this.elements.length;
  }

  // Clears the stack
  clear(): void {
    this.elements = [];
  }

  // Returns the elements of the stack
  toArray(): T[] {
    return this.elements;
  }
}

export default Stack;
