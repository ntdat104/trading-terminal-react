class BinanceDatafeed {
  constructor(options) {
    this.binanceHost = "https://api.binance.com";
    this.debug = options.debug || false;
    this.listeners = {};
    this.websocket = null;
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
      return json.symbols;
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

  async searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    userInput = userInput.toUpperCase();
    console.log(this.symbols);
    onResultReadyCallback(
      this.symbols
        .filter((symbol) => {
          return symbol.symbol.indexOf(userInput) >= 0;
        })
        .map((symbol) => {
          return {
            symbol: symbol.symbol,
            full_name: symbol.symbol,
            description: symbol.baseAsset + " / " + symbol.quoteAsset,
            ticker: symbol.symbol,
            exchange: "Binance",
            type: "crypto",
            logo_urls: [
              `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol?.baseAsset}.svg`,
              `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol?.quoteAsset}.svg`,
            ],
            exchange_logo: `https://s3-symbol-logo.tradingview.com/provider/binance.svg`,
          };
        })
    );
  }

  async resolveSymbol(
    symbolName,
    onSymbolResolvedCallback,
    onResolveErrorCallback
  ) {
    this.debug && console.log("resolveSymbol:", symbolName);

    const comps = symbolName.split(":");
    symbolName = (comps.length > 1 ? comps[1] : symbolName).toUpperCase();

    function pricescale(symbol) {
      for (let filter of symbol.filters) {
        if (filter.filterType === "PRICE_FILTER") {
          return Math.round(1 / parseFloat(filter.tickSize));
        }
      }
      return 1;
    }

    for (let symbol of this.symbols) {
      if (symbol.symbol === symbolName) {
        setTimeout(() => {
          onSymbolResolvedCallback({
            name: symbol.symbol,
            exchange_logo: `https://s3-symbol-logo.tradingview.com/provider/binance.svg`,
            full_name: symbol.symbol,
            description: symbol.baseAsset + " / " + symbol.quoteAsset,
            ticker: symbol.symbol,
            logo_urls: [
              `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol?.baseAsset}.svg`,
              `https://s3-symbol-logo.tradingview.com/crypto/XTVC${symbol?.quoteAsset}.svg`,
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
        return;
      }
    }

    onResolveErrorCallback("not found");
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

    var from_time = periodParams.from * 1000;
    var to_time = periodParams.to * 1000;

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
          },
        };
      });
      onDataCallback(quotes);
    } catch (error) {
      onErrorCallback(error);
    }
  }

  // subscribeQuotes(symbols, fastSymbols, onRealtimeCallback, listenerGUID) {
  //   this.listeners[listenerGUID] = {
  //     symbols,
  //     fastSymbols,
  //     onRealtimeCallback,
  //   };

  //   console.log('symbols', symbols);

  //   if (!this.websocket) {
  //     this.websocket = new WebSocket(`wss://stream.binance.com:9443/ws`);

  //     this.websocket.onopen = () => {
  //       symbols.forEach((symbol) => {
  //         this.websocket.send(
  //           JSON.stringify({
  //             method: "SUBSCRIBE",
  //             params: [`${symbol.toLowerCase()}usdt@ticker`],
  //             id: 1,
  //           })
  //         );
  //       });
  //     };

  //     this.websocket.onmessage = (event) => {
  //       const message = JSON.parse(event.data);
  //       const data = message.data;

  //       const symbol = data.s.replace("USDT", "").toLowerCase();
  //       const callback = this.listeners[listenerGUID].onRealtimeCallback;

  //       callback({
  //         s: "ok",
  //         n: symbol,
  //         v: {
  //           ch: parseFloat(data.p),
  //           chp: parseFloat(data.P),
  //           short_name: symbol,
  //           exchange: "Binance",
  //           original_name: symbol,
  //           description: symbol,
  //           lp: parseFloat(data.c),
  //           ask: parseFloat(data.a),
  //           bid: parseFloat(data.b),
  //           spread: parseFloat(data.a) - parseFloat(data.b),
  //         },
  //       });
  //     };

  //     this.websocket.onerror = (error) => {
  //       console.error("WebSocket error:", error);
  //     };

  //     this.websocket.onclose = () => {
  //       console.log("WebSocket connection closed");
  //       this.websocket = null;
  //     };
  //   }
  // }

  unsubscribeQuotes(listenerGUID) {
    delete this.listeners[listenerGUID];

    if (Object.keys(this.listeners).length === 0 && this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }

  subscribeBars(
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback
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

    const websocket = new WebSocket("wss://stream.binance.com:9443/ws");

    websocket.onopen = () => {
      websocket.send(
        JSON.stringify({
          method: "SUBSCRIBE",
          params: [`${symbolInfo.name.toLowerCase()}@kline_${interval}`],
          id: 1,
        })
      );
    };

    let lastBar = null;

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (
        message.e === "kline" &&
        message.k.i === interval &&
        message.k.s === symbolInfo.name
      ) {
        const kline = message.k;
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
    };

    websocket.onerror = (event) => {
      console.error(event);
    };

    websocket.onclose = () => {
      console.log("WebSocket closed");
    };
  }

  unsubscribeBars(subscriberUID) {
    this.debug && console.log("👉 unsubscribeBars:", subscriberUID);
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