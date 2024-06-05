import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";

class MainAxios {
  private static instance: AxiosInstance;

  /**
   * The Singleton's constructor should always be private to prevent direct
   * construction calls with the `new` operator.
   */

  // eslint-disable-next-line
  private constructor() {}

  /**
   * The static method that controls the access to the singleton instance.
   *
   * This implementation let you subclass the Singleton class while keeping
   * just one instance of each subclass around.
   */

  public static getInstance(
    config: AxiosRequestConfig<any> | undefined
  ): AxiosInstance {
    if (!MainAxios.instance) {
      MainAxios.instance = axios.create(config);
    }

    return MainAxios.instance;
  }

  public static setInstance(config: AxiosRequestConfig<any> | undefined) {
    MainAxios.instance = axios.create(config);
  }

  /**
   * Finally, any singleton should define some business logic, which can be
   * executed on its instance.
   */
  public someBusinessLogic() {
    // ...
  }
}

const mainAxios = MainAxios.getInstance({
  baseURL: import.meta.env.VITE_BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

mainAxios.interceptors.request.use(
  (config) => {
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

mainAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

export default mainAxios;
