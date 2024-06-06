export class Observable {
  subscribe: Subscribe;

  constructor(_subscribe: Subscribe) {
    this.subscribe = _subscribe;
  }

  public static setTimeout(miliseconds: number) {
    const _subscribe = (
      observerOrNext: Observer | Function,
      error?: Function,
      complete?: Function
    ) => {
      let observer: Observer;

      if (typeof observerOrNext === "function") {
        observer = {
          next: observerOrNext,
          error: error || (() => {}),
          complete: complete || (() => {}),
        };
      } else {
        observer = observerOrNext;
      }

      const timeout = setTimeout(() => {
        observer.next();
        observer.complete();
      }, miliseconds);

      return new Subscription(() => {
        clearTimeout(timeout);
      });
    };

    return new Observable(_subscribe);
  }

  public static setInterval(miliseconds: number) {
    const _subscribe = (
      observerOrNext: Observer | Function,
      error: Function = () => {},
      complete: Function = () => {}
    ) => {
      let observer: Observer;

      if (typeof observerOrNext === "function") {
        observer = {
          next: observerOrNext,
          error,
          complete,
        };
      } else {
        observer = observerOrNext;
      }

      const interval = setInterval(() => {
        observer.next();
      }, miliseconds);

      return new Subscription(() => {
        clearInterval(interval);
      });
    };

    return new Observable(_subscribe);
  }

  public static from(array: any[]) {
    const _subscribe = (
      observerOrNext: Observer | Function,
      error?: Function,
      complete?: Function
    ) => {
      let observer: Observer;

      if (typeof observerOrNext === "function") {
        observer = {
          next: observerOrNext,
          error: error || (() => {}),
          complete: complete || (() => {}),
        };
      } else {
        observer = observerOrNext;
      }

      array.forEach((item, index) => {
        setTimeout(() => {
          observer.next(item);
          if (index === array.length - 1) {
            observer.complete();
          }
        }, index * 1000);
      });

      return new Subscription(() => {
        // No cleanup needed for this simple implementation
      });
    };

    return new Observable(_subscribe);
  }
}

export class Subscription {
  unsubscribe: Function;
  constructor(unsubscribe: Function) {
    this.unsubscribe = unsubscribe;
  }
}

export type Subscribe = (
  observerOrNext: Observer | Function,
  error?: Function,
  complete?: Function
) => Subscription;

export interface Observer {
  next: Function;
  complete: Function;
  error: Function;
}

// const observable = Observable.from([1, 2, 3]);
// const subscription = observable.subscribe({
//   next: (value) => console.log(value),
//   complete: () => console.log('Complete'),
//   error: (err) => console.error(err),
// });
