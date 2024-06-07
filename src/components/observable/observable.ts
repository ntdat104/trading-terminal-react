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

export class Observable {
  subscribe: Subscribe;

  constructor(_subscribe: Subscribe) {
    this.subscribe = _subscribe;
  }

  public pipe(_observable: Observable) {
    const _subscribe = (
      observerOrNext: Observer | Function,
      error?: Function,
      complete?: Function
    ) => {
      let observer: Observer;
      let subscription: Subscription;

      if (typeof observerOrNext === "function") {
        observer = {
          next: observerOrNext,
          error: error || (() => {}),
          complete: complete || (() => {}),
        };
      } else {
        observer = observerOrNext;
      }

      observer.next(
        (() => {
          return 123;
        })()
      );

      return new Subscription(() => {
        subscription.unsubscribe();
      });
    };

    return new Observable(_subscribe);
  }
}

/** =================== timeout ================== **/
export const timeout = (miliseconds: number) => {
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
};

/** =================== interval ================== **/
export const interval = (miliseconds: number) => {
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
};

/** =================== from ================== **/
export const from = <T>(array: T[]) => {
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

    for (let i = 0; i < array.length; i++) {
      observer.next(array[i]);
    }
    observer.complete();

    return new Subscription(() => {
      // No cleanup needed for this simple implementation
    });
  };

  return new Observable(_subscribe);
};
