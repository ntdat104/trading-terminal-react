import mainAxios from '@/api/main-axios';
import { isEmpty } from './check-empty-object';
import { generateCacheKey } from './generate-key';

type Cache = {
  loading?: boolean;
  hasError?: boolean;
  response?: any;
  error?: any;
  isEmpty?: boolean;
  calling?: boolean;
  updatedAt: number;
};

type Subscriber = {
  key: string;
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  timeout?: number;
  disable?: boolean;
  callback: (response: any) => void;
};

type Observer = {
  subscribe: (callback: (response: any) => void) => void;
};

type Register = {
  url: string;
  method?: 'GET' | 'POST';
  body?: any;
  timeout?: number;
  disable?: boolean;
};

class ApiService {
  private subscribers: Record<string, Subscriber>;
  private cache: Record<string, Cache>;
  private observer: Record<string, Observer>;

  constructor() {
    this.subscribers = {};
    this.cache = {};
    this.observer = {};
  }

  private fetchData(
    key: string,
    url: string,
    method: 'GET' | 'POST',
    body?: any
  ) {
    (async () => {
      try {
        let response: any;
        if (method === 'GET') {
          response = await mainAxios.get(url);
        } else {
          response = await mainAxios.post(url, body);
        }
        this.cache[key] = {
          ...this.cache[key],
          loading: false,
          response: response,
          hasError: false,
          error: null,
          isEmpty: isEmpty(response.data),
          calling: false,
          updatedAt: Date.now(),
        };
        this.subscribers[key].callback(this.cache[key]);
      } catch (error) {
        this.cache[key] = {
          ...this.cache[key],
          loading: false,
          response: null,
          hasError: true,
          error: error,
          isEmpty: false,
          calling: false,
          updatedAt: Date.now(),
        };
        this.subscribers[key].callback(this.cache[key]);
      }
    })();
  }

  public register(params: Register) {
    const {
      url,
      method = 'GET',
      body,
      timeout = 60 * 1000,
      disable = false,
    } = params;
    const key = generateCacheKey(url, method, timeout, disable, body);

    if (this.observer[key]) {
      return this.observer[key];
    }

    const observer = {
      subscribe: (callback: (response: any) => void) => {
        this.subscribers[key].callback = callback;

        if (this.cache[key]?.calling) {
          return;
        }

        if (!this.cache[key]) {
          this.cache[key] = {
            loading: true,
            hasError: false,
            response: null,
            error: null,
            isEmpty: false,
            calling: true,
            updatedAt: Date.now(),
          };
          this.subscribers[key].callback(this.cache[key]);
          this.fetchData(key, url, method, body);
        }

        if (disable) {
          this.subscribers[key].callback(this.cache[key]);
          this.fetchData(key, url, method, body);
        }

        if (Date.now() - this.cache[key]?.updatedAt > timeout) {
          this.cache[key] = {
            ...this.cache[key],
            hasError: false,
            error: null,
            isEmpty: false,
            calling: true,
            updatedAt: Date.now(),
          };
          this.subscribers[key].callback(this.cache[key]);
          this.fetchData(key, url, method, body);
        }
      },
    };

    this.observer[key] = observer;

    this.subscribers[key] = {
      key,
      url,
      method,
      body,
      timeout,
      disable,
      callback: () => {},
    };
    return this.observer[key];
  }
}

export default ApiService;
