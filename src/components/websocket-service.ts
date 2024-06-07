import { from, interval, timeout } from "./observable/observable";
import Storage from "./storage";

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
  private requestMessages: RequestMessage[] = [];
  private params: string[] = [];
  private subscribers: Record<string, Subscriber> = {};
  private storage: Storage;

  constructor(options: Option) {
    this.url = options.url;
    this.protocols = options.protocols;
    this.storage = new Storage();
  }

  public connect() {
    if (!this.ws || this.ws.readyState === ReadyStateEnum.CLOSED) {
      this.ws = new WebSocket(this.url, this.protocols);

      this.ws.addEventListener("open", async (_ev: Event) => {
        // console.log("Websocket is connected");
        from(this.requestMessages).subscribe((request: RequestMessage) => {
          timeout(1000).subscribe(() => {
            this.ws?.send(request as RequestMessage);
          });
        });
      });

      this.ws.addEventListener("error", (_ev: Event) => {
        // console.log("Websocket is error", ev);
      });

      this.ws.addEventListener("close", (_ev: CloseEvent) => {
        // console.log("Websocket is closed");
        timeout(2000).subscribe(() => {
          this.connect();
        });
      });

      this.ws.addEventListener("message", (ev: MessageEvent<any>) => {
        const message = JSON.parse(ev.data);
        if (message?.data?.s) {
          this.storage.updateSymbol({
            symbol: message?.data?.s,
            value: message?.data,
          });
        }
        for (const id in this.subscribers) {
          this.subscribers[id].callback(ev);
        }
      });

      from([1, 2, 3])
        .pipe(timeout(1000))
        .subscribe((res) => {
          console.log("res", res);
        });

      interval(1000).subscribe(() => {
        const request = this.requestMessages.shift();
        if (request) {
          this.ws?.send(request);
        }
      });
    }
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    try {
      const request = JSON.parse(data as string);
      const params: string[] = [];
      if (request?.params) {
        request?.params?.forEach((param: string) => {
          if (!this.params.includes(param)) {
            this.params.push(param);
            params.push(param);
          }
        });
      }
      request["params"] = params;
      if (request?.params?.length > 0) {
        this.requestMessages.push(JSON.stringify(request));
      }
    } catch (error) {
      console.log(error);
    }
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

  public unsubscribe(id: string) {
    delete this.subscribers[id];
  }
}

export default WebsocketService;
