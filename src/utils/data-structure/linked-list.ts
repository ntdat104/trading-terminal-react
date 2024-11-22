class LinkedList<T> {
  private head: Node<T> | null = null;
  private size = 0;

  constructor(elements?: T[]) {
    if (elements !== undefined) {
      elements.forEach((value) => {
        this.add(value);
      });
    }
  }

  // Add element to the end of the list
  add(value: T): void {
    const newNode = new Node(value);

    if (this.head === null) {
      this.head = newNode;
    } else {
      let current = this.head;
      while (current.next !== null) {
        current = current.next;
      }
      current.next = newNode;
    }

    this.size++;
  }

  // Remove element by value
  remove(value: T): boolean {
    if (this.head === null) return false;

    if (this.head.value === value) {
      this.head = this.head.next;
      this.size--;
      return true;
    }

    let current = this.head;
    while (current.next !== null && current.next.value !== value) {
      current = current.next;
    }

    if (current.next === null) return false;

    current.next = current.next.next;
    this.size--;
    return true;
  }

  // Find element by value
  find(value: T): Node<T> | null {
    let current = this.head;
    while (current !== null) {
      if (JSON.stringify(current.value) === JSON.stringify(value)) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  // Get element at specific index
  get(index: number): T | null {
    if (index < 0 || index >= this.size) return null;

    let current = this.head;
    for (let i = 0; i < index; i++) {
      if (current !== null) {
        current = current.next;
      }
    }

    return current ? current.value : null;
  }

  // Convert the linked-list to an array
  toArray(): T[] {
    const elements: T[] = [];
    let current = this.head;
    while (current !== null) {
      elements.push(current.value);
      current = current.next;
    }
    return elements;
  }
}

class Node<T> {
  value: T;
  next: Node<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export default LinkedList;
