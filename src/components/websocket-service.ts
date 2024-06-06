enum ReadyStateEnum {
  "CONNECTING" = 0,
  "OPEN" = 1,
  "CLOSING" = 2,
  "CLOSED" = 3,
}

type Option = {
  url: string | URL;
  protocols?: string | string[] | undefined;
};

type Subscriber = {
  id: string;
  params: string[];
  callback: (ev: MessageEvent<any>) => void;
};

type RequestMessage = string | ArrayBufferLike | Blob | ArrayBufferView;

class WebsocketService {
  private ws?: WebSocket;
  private url: string | URL;
  private protocols?: string | string[] | undefined;
  private requestMessageList: RequestMessage[] = [];
  private messageEventList: MessageEvent<any>[] = [];
  private subscribers: Record<string, Subscriber> = {};

  constructor(options: Option) {
    this.url = options.url;
    this.protocols = options.protocols;
  }

  public sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public connect() {
    this.sendAsync();
    if (!this.ws || this.ws.readyState === ReadyStateEnum.CLOSED) {
      this.ws = new WebSocket(this.url, this.protocols);

      this.ws.addEventListener("open", async (_ev: Event) => {
        console.log("Websocket is connected");
        for (const request of this.requestMessageList) {
          this.ws?.send(request);
          await this.sleep(4000);
        }
      });

      this.ws.addEventListener("error", (ev: Event) => {
        console.log("Websocket is error", ev);
      });

      this.ws.addEventListener("close", (_ev: CloseEvent) => {
        console.log("Websocket is closed");
        setTimeout(() => {
          this.connect();
        }, 3000);
      });

      this.ws.addEventListener("message", (ev: MessageEvent<any>) => {
        this.messageEventList.push(ev);
        for (const id in this.subscribers) {
          this.subscribers[id].callback(ev);
        }
      });
    }
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.ws && this.ws.readyState === ReadyStateEnum.OPEN) {
      this.requestMessageList.push(data);
    }

    setTimeout(() => {
      this.send(data);
    }, 300);
  }

  public async sendAsync() {
    const request = this.requestMessageList.shift();

    if (this.ws && this.ws.readyState === ReadyStateEnum.OPEN) {
      if (request) {
        this.ws?.send(request);
      }
    }

    setInterval(() => {
      this.sendAsync();
    }, 300);
  }

  public addSubscriber({ id, params }: { id: string; params: string[] }) {
    this.subscribers[id] = {
      id,
      params,
      callback: () => null,
    };
    return {
      send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) =>
        this.send(data),
      subscribe: (callback: (ev: MessageEvent<any>) => void) => {
        this.subscribers[id] = {
          ...this.subscribers[id],
          callback,
        };
      },
    };
  }

  public subscribe(id: string) {
    return (callback: (messageEvent: MessageEvent<any>) => void) => {
      if (this.ws && this.ws.readyState === ReadyStateEnum.OPEN) {
        this.messageEventList.forEach((messageEvent: MessageEvent<any>) => {
          if (messageEvent) {
            callback(messageEvent);
          }
        });
        this.messageEventList = [];
      }

      setTimeout(() => {
        this.subscribe(id)(callback);
      }, 400);
    };
  }
}

export default WebsocketService;
