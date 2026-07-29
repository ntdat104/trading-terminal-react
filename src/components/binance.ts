import {
  ErrorCallback,
  HistoryCallback,
  LibrarySymbolInfo,
  OnReadyCallback,
  PeriodParams,
  QuoteData,
  QuoteErrorData,
  QuoteOkData,
  QuotesCallback,
  QuotesErrorCallback,
  ResolutionString,
  ResolveCallback,
  SearchSymbolsCallback,
  ServerTimeCallback,
  SubscribeBarsCallback,
} from "@@/public/static/charting_library/charting_library";
import { formatPrice } from "./format-price";
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

  async binanceKlines(
    symbol: string,
    interval: string,
    endTime: number,
    limit: number
  ) {
    const url = `${this.binanceHost}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}&endTime=${endTime}`;
    try {
      const response = await fetch(url);
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(error);
      throw new Error(`Unable to fetch klines for symbol ${symbol}.`);
    }
  }

  async onReady(callback: OnReadyCallback) {
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
        ] as ResolutionString[],
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
    onResult: SearchSymbolsCallback
  ) {
    const exchange = "BINANCE";
    const symbolType = "crypto";
    if (!userInput) {
      userInput = "BTC";
    }
    const data: any = [];
    for (const symbol in this.symbols) {
      if (symbol.indexOf(userInput.toUpperCase()) === 0 && data.length < 20) {
        data.push(this.symbols[symbol]);
      }
    }
    setTimeout(() => {
      onResult(
        data?.map((item: any) => ({
          symbol: item?.symbol,
          full_name: item?.symbol,
          description: item?.symbol,
          ticker: item?.symbol,
          exchange: exchange,
          type: symbolType,
          logo_urls: [
            `/static/images/crypto/${item?.baseAsset}.png`,
            `/static/images/crypto/${item?.quoteAsset}.png`,
          ],
          exchange_logo: "/static/images/provider/binance.svg",
        }))
      );
    }, 0);
  }

  // async searchSymbols(
  //   userInput: string,
  //   _exchange: string,
  //   _symbolType: string,
  //   onResult: SearchSymbolsCallback
  // ) {
  //   const exchange = "BINANCE";
  //   const symbolType = "crypto";
  //   const response = await fetch(
  //     `https://symbol-search.tradingview.com/local_search/?text=${userInput}&exchange=${exchange}&type=${symbolType}&tradable=1`
  //   );
  //   const data = await response.json();

  //   setTimeout(() => {
  //     onResult(
  //       data?.map((item: any) => ({
  //         symbol: item?.symbol,
  //         full_name: item?.description,
  //         description: item?.description,
  //         ticker: item?.symbol,
  //         exchange: item?.source_id,
  //         type: `${item?.type} ${item?.typespecs?.join(" ")}`,
  //         logo_urls: [
  //           `/static/images/crypto/${item?.symbol?.split(`${item?.currency_code}`)[0]
  //           }.png`,
  //           `/static/images/crypto/${item?.currency_code}.png`,
  //         ],
  //         exchange_logo: `/static/images/provider/${item?.provider_id}.svg`,
  //       }))
  //     );
  //   }, 0);
  // }

  async resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback
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
        onResolve({
          name: symbol.symbol,
          exchange_logo: `/static/images/provider/${`binance`}.svg`,
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
          timezone: "Asia/Ho_Chi_Minh",
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          currency_code: symbol.quoteAsset,
        });
      }, 0);
    }

    setTimeout(() => {
      onError("not found");
    }, 0);
  }

  async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: ErrorCallback
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

    const getKlines = (end_time: number) => {
      this.binanceKlines(symbolInfo.name, interval, end_time, 1000)
        .then((klines) => {
          totalKlines = totalKlines.concat(klines);
          finishKlines();
        })
        .catch((err) => {
          console.error(err);
          onError("Some problem");
        });
    };

    // const from_time = periodParams.from * 1000;
    const to_time = periodParams.to * 1000;

    getKlines(to_time);
  }

  async getQuotes(
    symbols: string[],
    onDataCallback: QuotesCallback,
    onErrorCallback: QuotesErrorCallback
  ) {
    if (symbols.length === 0) {
      return;
    }
    const symbolQuery = symbols.map((s) => `"${s.toUpperCase()}"`).join(",");
    const url = `${this.binanceHost}/api/v3/ticker/24hr?symbols=[${symbolQuery}]`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const quotes: QuoteData[] = symbols.map((symbol) => {
        const symbolData = data.find((d) => d.symbol === symbol.toUpperCase());
        if (!symbolData) {
          return { s: "error", n: symbol } as QuoteErrorData;
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
        } as QuoteOkData;
      });
      setTimeout(() => onDataCallback(quotes), 0);
    } catch (_error) {
      setTimeout(() => onErrorCallback("getQuotes error"), 0);
    }
  }

  subscribeQuotes(
    symbols: string[],
    _fastSymbols: string[],
    onRealtimeCallback: QuotesCallback,
    listenerGUID: string
  ) {
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
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    _onResetCacheNeededCallback: () => void
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

    const params = [
      `${symbolInfo.name.toLowerCase()}@kline_${interval}`,
      `${symbolInfo.name.toLowerCase()}@aggTrade`
    ];

    let lastBar: any = null;

    const subscriber = this.ws.addSubscriber({
      id: listenerGuid,
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
        message?.data?.e === "aggTrade" &&
        message?.data?.s === symbolInfo.name
      ) {
        document.title = `${formatPrice(message?.data?.p)} | ${message?.data?.s} | Trading`;
        if (lastBar !== null) {
          const bar = {
            ...lastBar,
            close: parseFloat(message?.data?.p)
          };
          onTick(bar);
        }
      }
      if (
        message?.data?.e === "kline" &&
        message?.data?.k?.i === interval &&
        message?.data?.k?.s === symbolInfo.name
      ) {
        const kline = message?.data?.k;
        document.title = `${formatPrice(kline?.c)} | ${kline?.s} | Trading`;
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
          onTick(bar);
        } else if (bar.time === lastBar.time) {
          lastBar = bar;
          onTick(bar);
        }
      }
    });
  }

  unsubscribeBars(listenerGuid: string) {
    this.ws.unsubscribe(listenerGuid);
  }

  getServerTime(callback: ServerTimeCallback) {
    this.binanceServerTime()
      .then((time) => {
        callback(Math.floor(time / 1000));
      })
      .catch((err) => {
        console.error(err);
      });
  }
}

type DNSEOption = {
  dnseHost?: string;
  debug?: boolean;
};

// Datafeed cho thị trường chứng khoán Việt Nam (nguồn DNSE),
// đặt cùng group với chart giống BinanceDatafeed.
class DNSEDatafeed {
  private dnseHost: string;
  private debug: boolean;
  private symbols: any = {};
  private subscriptions: Record<string, ReturnType<typeof setInterval>> = {};

  // Tên hiển thị cho từng sàn (floor) và từng loại chứng khoán (type)
  private exchangeNames: Record<string, string> = {
    HOSE: "Sàn HOSE",
    HNX: "Sàn HNX",
    UPCOM: "Sàn UPCOM",
    HNX_BOND: "Trái phiếu HNX",
  };
  private typeNames: Record<string, string> = {
    STOCK: "Cổ phiếu",
    ETF: "ETF",
    COVERED_WARRANT: "Chứng quyền",
    CORPORATE_BOND: "Trái phiếu",
    FU: "Phái sinh",
    INDEX: "Chỉ số",
    IFC: "Quỹ đóng",
  };

  constructor(options: DNSEOption = {}) {
    this.dnseHost = options.dnseHost || "https://api.dnse.com.vn";
    this.debug = options?.debug || false;
  }

  // TradingView resolution -> DNSE resolution
  // 1 = 1 phút (nhỏ nhất), 1H = 1 giờ, 1D = 1 ngày, 1W = 1 tuần, 1M = 1 tháng
  private toDnseResolution(resolution: ResolutionString): string | undefined {
    return {
      "1": "1",
      "60": "1H",
      "1H": "1H",
      D: "1D",
      "1D": "1D",
      W: "1W",
      "1W": "1W",
      M: "1M",
      "1M": "1M",
    }[resolution];
  }

  async dnseTickers(symbol?: string) {
    const query = symbol ? `?symbol=${encodeURIComponent(symbol)}` : "";
    const url = `${this.dnseHost}/market-api/tickers${query}`;
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json, text/plain, */*" },
      });
      const json = await response.json();
      if (this.debug) {
        console.log(json);
      }
      return json?.data || [];
    } catch (error) {
      console.error(error);
      throw new Error("Unable to fetch DNSE tickers.");
    }
  }

  async dnseOhlcv(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ) {
    const url = `${this.dnseHost}/chart-api/v2/ohlcs/stock?from=${from}&to=${to}&symbol=${symbol}&resolution=${resolution}`;
    try {
      const response = await fetch(url, {
        headers: { accept: "application/json, text/plain, */*" },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(error);
      throw new Error(`Unable to fetch DNSE ohlcv for symbol ${symbol}.`);
    }
  }

  async onReady(callback: OnReadyCallback) {
    try {
      const tickers = await this.dnseTickers();
      const symbols = {};
      // Group lại theo sàn (exchange) và loại (symbol type) để hiện bộ lọc
      // trong Symbol Search của TradingView.
      const floors = new Set<string>();
      const types = new Set<string>();
      tickers.forEach((item: any) => {
        symbols[item?.symbol] = { ...item };
        if (item?.floor) floors.add(item.floor);
        if (item?.type) types.add(item.type);
      });
      this.symbols = symbols;

      const exchanges = [
        { value: "", name: "Tất cả sàn", desc: "Tất cả sàn" },
        ...Array.from(floors).map((floor) => ({
          value: floor,
          name: floor,
          desc: this.exchangeNames[floor] || floor,
        })),
      ];

      const symbols_types = [
        { value: "", name: "Tất cả loại" },
        ...Array.from(types).map((type) => ({
          value: type,
          name: this.typeNames[type] || type,
        })),
      ];

      callback({
        exchanges,
        symbols_types,
        supports_marks: false,
        supports_timescale_marks: false,
        supports_time: true,
        supported_resolutions: [
          "1",
          "60",
          "1D",
          "1W",
          "1M",
        ] as ResolutionString[],
      });
    } catch (error) {
      console.error(error);
      throw new Error("Unable to initialize DNSE datafeed.");
    }
  }

  async searchSymbols(
    userInput: string,
    exchange: string,
    symbolType: string,
    onResult: SearchSymbolsCallback
  ) {
    const keyword = (userInput || "").toUpperCase();
    const data: any = [];
    for (const symbol in this.symbols) {
      const item = this.symbols[symbol];
      // Bộ lọc theo sàn / loại được người dùng chọn trong Symbol Search
      if (exchange && item?.floor !== exchange) continue;
      if (symbolType && item?.type !== symbolType) continue;
      const matched =
        symbol.indexOf(keyword) === 0 ||
        (item?.companyName || "").toUpperCase().indexOf(keyword) >= 0 ||
        (item?.shortName || "").toUpperCase().indexOf(keyword) >= 0;
      if (matched && data.length < 30) {
        data.push(item);
      }
    }
    setTimeout(() => {
      onResult(
        data.map((item: any) => ({
          symbol: item?.symbol,
          full_name: item?.symbol,
          description: item?.companyName || item?.shortName || item?.symbol,
          ticker: item?.symbol,
          exchange: item?.floor || "HOSE",
          type: item?.type || "",
          logo_urls: item?.logo ? [item.logo] : undefined,
        }))
      );
    }, 0);
  }

  async resolveSymbol(
    symbolName: string,
    onResolve: ResolveCallback,
    onError: ErrorCallback
  ) {
    this.debug && console.log("resolveSymbol:", symbolName);

    const comps = symbolName.split(":");
    symbolName = (comps.length > 1 ? comps[1] : symbolName).toUpperCase();

    const symbol = this.symbols[symbolName];

    if (symbol) {
      setTimeout(() => {
        onResolve({
          name: symbol.symbol,
          description: symbol.companyName || symbol.shortName || symbol.symbol,
          ticker: symbol.symbol,
          logo_urls: symbol?.logo ? [symbol.logo] : undefined,
          exchange: symbol.floor || "HOSE",
          listed_exchange: symbol.floor || "HOSE",
          type: symbol.type || "stock",
          session: "0900-1500",
          format: "price",
          minmov: 1,
          pricescale: 100,
          timezone: "Asia/Ho_Chi_Minh",
          has_intraday: true,
          has_daily: true,
          has_weekly_and_monthly: true,
          currency_code: "VND",
        });
      }, 0);
      return;
    }

    setTimeout(() => {
      onError("not found");
    }, 0);
  }

  async getBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    periodParams: PeriodParams,
    onResult: HistoryCallback,
    onError: ErrorCallback
  ) {
    const dnseResolution = this.toDnseResolution(resolution);
    if (!dnseResolution) {
      onError("Invalid interval");
      return;
    }

    try {
      const data = await this.dnseOhlcv(
        symbolInfo.name,
        dnseResolution,
        periodParams.from,
        periodParams.to
      );

      const times: number[] = data?.t || [];
      if (times.length === 0) {
        onResult([], { noData: true });
        return;
      }

      const bars = times.map((t: number, i: number) => ({
        time: t * 1000, // DNSE trả về giây, TradingView cần mili-giây
        open: data.o[i],
        high: data.h[i],
        low: data.l[i],
        close: data.c[i],
        volume: data.v[i],
      }));

      onResult(bars, { noData: false });
    } catch (err) {
      console.error(err);
      onError("Some problem");
    }
  }

  subscribeBars(
    symbolInfo: LibrarySymbolInfo,
    resolution: ResolutionString,
    onTick: SubscribeBarsCallback,
    listenerGuid: string,
    _onResetCacheNeededCallback: () => void
  ) {
    const dnseResolution = this.toDnseResolution(resolution);
    if (!dnseResolution) {
      return;
    }

    // DNSE không cung cấp websocket công khai ở đây nên poll bar mới nhất.
    let lastBarTime = 0;

    const poll = async () => {
      const now = Math.floor(Date.now() / 1000);
      const from = now - 60 * 60 * 24 * 5; // đủ để lấy vài bar gần nhất
      try {
        const data = await this.dnseOhlcv(
          symbolInfo.name,
          dnseResolution,
          from,
          now
        );
        const times: number[] = data?.t || [];
        if (times.length === 0) return;

        const i = times.length - 1;
        const bar = {
          time: times[i] * 1000,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        };

        if (bar.time >= lastBarTime) {
          lastBarTime = bar.time;
          document.title = `${formatPrice(bar.close)} | ${symbolInfo.name} | Trading`;
          onTick(bar);
        }
      } catch (err) {
        this.debug && console.error(err);
      }
    };

    poll();
    this.subscriptions[listenerGuid] = setInterval(poll, 5000);
  }

  unsubscribeBars(listenerGuid: string) {
    const timer = this.subscriptions[listenerGuid];
    if (timer) {
      clearInterval(timer);
      delete this.subscriptions[listenerGuid];
    }
  }

  getServerTime(callback: ServerTimeCallback) {
    callback(Math.floor(Date.now() / 1000));
  }
}

export default BinanceDatafeed;
export { DNSEDatafeed };
