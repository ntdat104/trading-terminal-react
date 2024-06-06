import WebsocketService from "./websocket-service";

type Option = {
  binanceHost?: string;
  debug?: boolean;
};

class BinanceDatafeed {
  private binanceHost: string;
  private debug: boolean;
  private ws: WebsocketService;
  private symbols: any = {};
  private count: number = 1;

  constructor(options: Option) {
    this.binanceHost = options.binanceHost || "https://api.binance.com";
    this.debug = options?.debug || false;
    this.ws = new WebsocketService({
      url: `wss://stream.binance.com/stream`,
    });
  }

  async binanceServerTime() {
    try {
      const response = await fetch(`${this.binanceHost}/api/v3/time`);
      const json = await response.json();
      if (this.debug) {
        console.log(json);
      }
      return json.serverTime;
    } catch (error) {
      console.error(error);
      throw new Error("Unable to fetch Binance server time.");
    }
  }

  async binanceSymbols() {
    try {
      const response = await fetch(`${this.binanceHost}/api/v3/exchangeInfo`);
      const json = await response.json();
      if (this.debug) {
        console.log(json);
      }
      const symbols = {};
      json.symbols?.forEach((item) => {
        symbols[item?.symbol] = { ...item };
      });
      return symbols;
    } catch (error) {
      console.error(error);
      throw new Error("Unable to fetch Binance symbols.");
    }
  }

  async binanceKlines(symbol, interval, startTime, endTime, limit) {
    const url = `${this.binanceHost}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&startTime=${startTime}&endTime=${endTime}`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(error);
      throw new Error(`Unable to fetch klines for symbol ${symbol}.`);
    }
  }

  async onReady(callback) {
    try {
      this.ws.connect();
      const symbols = await this.binanceSymbols();
      this.symbols = symbols;
      callback({
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        supported_resolutions: [
          "1",
          "3",
          "5",
          "15",
          "30",
          "60",
          "120",
          "240",
          "360",
          "480",
          "720",
          "1D",
          "3D",
          "1W",
          "1M",
        ],
      });
    } catch (error) {
      console.error(error);
      throw new Error("Unable to initialize Binance datafeed.");
    }
  }

  async searchSymbols(
    userInput: string,
    _exchange: string,
    _symbolType: string,
    onResultReadyCallback
  ) {
    const exchange = "BINANCE";
    const symbolType = "crypto";
    const response = await fetch(
      `https://symbol-search.tradingview.com/local_search/?text=${userInput}&exchange=${exchange}&type=${symbolType}&tradable=1`
    );
    const data = await response.json();

    setTimeout(() => {
      onResultReadyCallback(
        data?.map((item: any) => ({
          symbol: item?.symbol,
          full_name: item?.description,
          description: item?.description,
          ticker: item?.symbol,
          exchange: item?.source_id,
          type: `${item?.type} ${item?.typespecs?.join(" ")}`,
          logo_urls: [
            `/static/images/crypto/${
              item?.symbol?.split(`${item?.currency_code}`)[0]
            }.png`,
            `/static/images/crypto/${item?.currency_code}.png`,
          ],
          exchange_logo: `/static/images/provider/${item?.provider_id}.svg`,
        }))
      );
    }, 0);
  }

  async resolveSymbol(
    symbolName: string,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) {
    this.debug && console.log("resolveSymbol:", symbolName);

    const comps = symbolName.split(":");
    symbolName = (comps.length > 1 ? comps[1] : symbolName).toUpperCase();

    const pricescale = (symbol: any) => {
      for (const filter of symbol.filters) {
        if (filter.filterType === "PRICE_FILTER") {
          return Math.round(1 / parseFloat(filter.tickSize));
        }
      }
      return 1;
    };

    const symbol = this.symbols[symbolName];

    if (symbol) {
      setTimeout(() => {
        onSymbolResolvedCallback({
          name: symbol.symbol,
          exchange_logo: `/static/images/provider/${`binance`}.svg`,
          full_name: symbol.symbol,
          description: symbol.baseAsset + " / " + symbol.quoteAsset,
          ticker: symbol.symbol,
          logo_urls: [
            `/static/images/crypto/${symbol?.baseAsset}.svg`,
            `/static/images/crypto/${symbol?.quoteAsset}.svg`,
          ],
          exchange: "Binance",
          listed_exchange: "Binance",
          type: "crypto",
          session: "24x7",
          format: "price",
          minmov: 1,
          pricescale: pricescale(symbol),
          timezone: "UTC",
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          currency_code: symbol.quoteAsset,
        });
      }, 0);
    }

    setTimeout(() => {
      onResolveErrorCallback("not found");
    }, 0);
  }

  async getBars(symbolInfo, resolution, periodParams, onResult, onError) {
    const interval = {
      1: "1m",
      3: "3m",
      5: "5m",
      15: "15m",
      30: "30m",
      60: "1h",
      120: "2h",
      240: "4h",
      360: "6h",
      480: "8h",
      720: "12h",
      D: "1d",
      "1D": "1d",
      "3D": "3d",
      W: "1w",
      "1W": "1w",
      M: "1M",
      "1M": "1M",
    }[resolution];

    if (!interval) {
      onError("Invalid interval");
    }

    let totalKlines = [];

    const finishKlines = () => {
      if (this.debug) {
        console.log("Total Klines", totalKlines.length);
      }

      if (totalKlines.length === 0) {
        onResult([], { noData: true });
      } else {
        onResult(
          totalKlines.map((kline) => {
            return {
              time: kline[0],
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
              volume: parseFloat(kline[5]),
            };
          }),
          {
            noData: false,
          }
        );
      }
    };

    const getKlines = (from, to) => {
      this.binanceKlines(symbolInfo.name, interval, from, to, 500)
        .then((klines) => {
          totalKlines = totalKlines.concat(klines);

          if (klines.length === 500) {
            from = klines[klines.length - 1][0] + 1;
            getKlines(from, to);
          } else {
            finishKlines();
          }
        })
        .catch((err) => {
          console.error(err);
          onError("Some problem");
        });
    };

    const from_time = periodParams.from * 1000;
    const to_time = periodParams.to * 1000;

    getKlines(from_time, to_time);
  }

  async getQuotes(symbols, onDataCallback, onErrorCallback) {
    if (symbols.length === 0) {
      return;
    }
    const symbolQuery = symbols.map((s) => `"${s.toUpperCase()}"`).join(",");
    const url = `${this.binanceHost}/api/v3/ticker/24hr?symbols=[${symbolQuery}]`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const quotes = symbols.map((symbol) => {
        const symbolData = data.find((d) => d.symbol === symbol.toUpperCase());
        if (!symbolData) {
          return { s: "error", n: symbol };
        }

        return {
          s: "ok",
          n: symbol,
          v: {
            ch: parseFloat(symbolData.priceChange),
            chp: parseFloat(symbolData.priceChangePercent),
            short_name: symbol,
            exchange: "Binance",
            original_name: symbol,
            description: symbol,
            lp: parseFloat(symbolData.lastPrice),
            ask: parseFloat(symbolData.askPrice),
            bid: parseFloat(symbolData.bidPrice),
            spread:
              parseFloat(symbolData.askPrice) - parseFloat(symbolData.bidPrice),
            open_price: parseFloat(symbolData?.openPrice),
            high_price: parseFloat(symbolData?.highPrice),
            low_price: parseFloat(symbolData?.lowPrice),
            prev_close_price: parseFloat(symbolData?.prevClosePrice),
            volume: parseFloat(symbolData?.volume),
          },
        };
      });
      setTimeout(() => onDataCallback(quotes), 0);
    } catch (error) {
      setTimeout(() => onErrorCallback(error), 0);
    }
  }

  subscribeQuotes(symbols, _fastSymbols, onRealtimeCallback, listenerGUID) {
    const params = symbols?.map((item) => `${item.toLowerCase()}@ticker`);

    const subscriber = this.ws.addSubscriber({
      id: listenerGUID,
      params: params,
    });

    subscriber.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: params,
        id: this.count++,
      })
    );

    subscriber.subscribe((event: MessageEvent<any>) => {
      const message = JSON.parse(event.data);
      if (message?.data && message?.data?.e === "24hrTicker") {
        const data = message?.data;
        onRealtimeCallback([
          {
            n: data?.s,
            s: "ok",
            v: {
              ch: parseFloat(data.p),
              chp: parseFloat(data.P),
              short_name: data?.s,
              exchange: "Binance",
              original_name: data?.s,
              description: data?.s,
              lp: parseFloat(data.c),
              ask: parseFloat(data.a),
              bid: parseFloat(data.b),
              spread: parseFloat(data.a) - parseFloat(data.b),
              open_price: parseFloat(data?.o),
              high_price: parseFloat(data?.h),
              low_price: parseFloat(data?.l),
              volume: parseFloat(data?.v),
            },
          },
        ]);
      }
    });
  }

  unsubscribeQuotes(listenerGUID: string) {
    this.ws.unsubscribe(listenerGUID);
  }

  subscribeBars(
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    _onResetCacheNeededCallback
  ) {
    const interval = {
      1: "1m",
      3: "3m",
      5: "5m",
      15: "15m",
      30: "30m",
      60: "1h",
      120: "2h",
      240: "4h",
      360: "6h",
      480: "8h",
      720: "12h",
      D: "1d",
      "1D": "1d",
      "3D": "3d",
      W: "1w",
      "1W": "1w",
      M: "1M",
      "1M": "1M",
    }[resolution];

    const params = [`${symbolInfo.name.toLowerCase()}@kline_${interval}`];

    let lastBar: any = null;

    const subscriber = this.ws.addSubscriber({
      id: subscriberUID,
      params: params,
    });

    subscriber.send(
      JSON.stringify({
        method: "SUBSCRIBE",
        params: params,
        id: this.count++,
      })
    );

    subscriber.subscribe((event: MessageEvent<any>) => {
      const message = JSON.parse(event.data);
      if (
        message?.data?.e === "kline" &&
        message?.data?.k?.i === interval &&
        message?.data?.k?.s === symbolInfo.name
      ) {
        const kline = message?.data?.k;
        const bar = {
          time: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };

        if (!lastBar || bar.time > lastBar.time) {
          lastBar = bar;
          onRealtimeCallback(bar);
        } else if (bar.time === lastBar.time) {
          lastBar = bar;
          onRealtimeCallback(bar);
        }
      }
    });
  }

  unsubscribeBars(subscriberUID: string) {
    this.ws.unsubscribe(subscriberUID);
  }

  getServerTime(callback) {
    this.binanceServerTime()
      .then((time) => {
        callback(Math.floor(time / 1000));
      })
      .catch((err) => {
        console.error(err);
      });
  }
}

export default BinanceDatafeed;
