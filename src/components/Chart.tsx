import {
  LanguageCode,
  ResolutionString,
  ThemeName,
  widget,
} from "@@/public/static/charting_library";
import React from "react";
import BinanceDatafeed from "./binance";
import LocalStorageSaveLoadAdapter from "./save-data-chart";

const Chart: React.FC = (): JSX.Element => {
  React.useEffect(() => {
    const getParameterByName = (name: string) => {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      const regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
      return results === null
        ? ""
        : decodeURIComponent(results[1].replace(/\+/g, " "));
    };

    const customCSS = `#documentation-toolbar-button {
      all: unset;
      position: relative;
      color: #FFF;
      font-size: 14px;
      font-weight: 400;
      line-height: 18px;
      letter-spacing: 0.15408px;
      padding: 5px 12px;
      border-radius: 80px;
      background: #2962FF;
      cursor: pointer;
    }
    #documentation-toolbar-button:hover {
      background: #1E53E5;
    }
    #documentation-toolbar-button:active {
      background: #1948CC;
    }
    #theme-toggle {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .switcher {
      display: inline-block;
      position: relative;
      flex: 0 0 auto;
      width: 38px;
      height: 20px;
      vertical-align: middle;
      z-index: 0;
      -webkit-tap-highlight-color: transparent;
    }

    .switcher input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 1;
      cursor: default;
    }

    .switcher .thumb-wrapper {
      display: block;
      border-radius: 20px;
      position: relative;
      z-index: 0;
      width: 100%;
      height: 100%;
    }

    .switcher .track {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      background-color: #a3a6af;
    }

    #theme-switch:checked + .thumb-wrapper .track {
      background-color: #2962ff;
    }

    .switcher .thumb {
      display: block;
      width: 14px;
      height: 14px;
      border-radius: 14px;
      transition-duration: 250ms;
      transition-property: transform;
      transition-timing-function: ease-out;
      transform: translate(3px, 3px);
      background: #ffffff;
    }

    [dir=rtl] .switcher .thumb {
      transform: translate(-3px, 3px);
    }

    .switcher input:checked + .thumb-wrapper .thumb {
      transform: translate(21px, 3px);
    }

    [dir=rtl] .switcher input:checked + .thumb-wrapper .thumb {
      transform: translate(-21px, 3px);
    }

    #documentation-toolbar-button:focus-visible:before,
    .switcher:focus-within:before {
      content: '';
      display: block;
      position: absolute;
      top: -2px;
      right: -2px;
      bottom: -2px;
      left: -2px;
      border-radius: 16px;
      outline: #2962FF solid 2px;
    }`;

    const fetchNews = async () => {
      const response = await fetch(
        "https://demo-feed-data.tradingview.com/tv_news"
      );
      const xml = await response.text();
      const parser = new DOMParser();
      const dom = parser.parseFromString(xml, "application/xml");
      const items = dom.querySelectorAll("item");

      return Array.from(items).map((item) => {
        const title = item.querySelector("title")?.textContent;
        const link = item.querySelector("link")?.textContent;
        // const description =
        //   item.querySelector("description")?.textContent ?? "";
        const pubDate = item.querySelector("pubDate")?.textContent as any;
        const contentNode = Array.from(item.childNodes).find(
          (el: any) => el.tagName === "content:encoded"
        );
        let decodedContent = "";
        if (contentNode) {
          const tempElement = document.createElement("div");
          tempElement.innerHTML = contentNode.textContent ?? "";
          decodedContent = tempElement.innerText;
        }
        return {
          // fullDescription: decodedContent,
          link,
          published: new Date(pubDate).valueOf(),
          shortDescription: decodedContent
            ? decodedContent.slice(0, 150) + "..."
            : "",
          source: "TradingView",
          title,
        };
      });
    };

    function initOnReady() {
      const cssBlob = new Blob([customCSS], {
        type: "text/css",
      });
      const cssBlobUrl = URL.createObjectURL(cssBlob);
      const isDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = getParameterByName("theme") || (isDark ? "dark" : "light");
      const tvwidget = new widget({
        debug: false,
        fullscreen: true,
        symbol: "BTCUSDT",
        interval: "1d" as ResolutionString,
        container: "tv_chart_container",
        //	BEWARE: no trailing slash is expected in feed URL
        datafeed: new BinanceDatafeed({ debug: false }),
        library_path: "static/charting_library/",
        locale: (getParameterByName("lang") || "vi") as LanguageCode,
        custom_css_url: cssBlobUrl,
        timezone: "Asia/Ho_Chi_Minh",

        disabled_features: [
          // 'use_localstorage_for_settings',
          "open_account_manager",
          "dom_widget",
        ],
        enabled_features: [
          "study_templates",
          "pre_post_market_sessions",
          "show_symbol_logos",
          "show_exchange_logos",
          "seconds_resolution",
          // 'custom_resolutions', // datafeed doesn't support this
          "secondary_series_extend_time_scale",
          // 'determine_first_data_request_size_using_visible_range',
          "show_percent_option_for_right_margin",
          // "display_data_mode",
          "items_favoriting",
        ],
        overrides: {
          // 'mainSeriesProperties.sessionId': 'extended',
        },
        charts_storage_url: "https://saveload.tradingview.com",
        charts_storage_api_version: "1.1",
        client_id: "trading_platform_demo",
        user_id: "public_user",
        theme: theme as ThemeName,
        save_load_adapter: new LocalStorageSaveLoadAdapter(),
        // custom_formatters: {
        //   priceFormatterFactory: () => {
        //     return {
        //       format: (price: number) =>
        //         formatPriceVND(getFinalValue(price), false),
        //     };
        //   },
        // },
        widgetbar: {
          details: true,
          news: true,
          watchlist: true,
          datawindow: true,
          watchlist_settings: {
            default_symbols: [
              "###CRYPTO",
              "BTCUSDT",
              "ETHUSDT",
              "BNBUSDT",
              "SOLUSDT",
              "XRPUSDT",
              "LINKUSDT",
              "DOTUSDT",
              "ADAUSDT",
            ],
          },
        },

        news_provider: async function getNews(_symbol, callback) {
          let newsItems: any[] = [];
          try {
            newsItems = await fetchNews();
          } catch (e) {
            console.error(e);
          }
          callback({
            title: "Tin tức mới nhất",
            newsItems,
          });
        },
      });

      tvwidget.headerReady().then(() => {
        const themeToggleEl = tvwidget.createButton({
          useTradingViewStyle: false,
          align: "right",
        });
        themeToggleEl.dataset.internalAllowKeyboardNavigation = "true";
        themeToggleEl.id = "theme-toggle";
        themeToggleEl.innerHTML = `<label for="theme-switch" id="theme-switch-label">Dark Mode</label>
        <div class="switcher">
          <input type="checkbox" id="theme-switch" tabindex="-1">
          <span class="thumb-wrapper">
            <span class="track"></span>
            <span class="thumb"></span>
          </span>
        </div>`;
        themeToggleEl.title = "Toggle theme";
        const checkboxEl = themeToggleEl.querySelector("#theme-switch") as any;
        checkboxEl.checked = theme === "dark";
        checkboxEl.addEventListener("change", function () {
          const themeToSet = checkboxEl.checked ? "dark" : "light";
          tvwidget.changeTheme(themeToSet, { disableUndo: true });
        });

        const themeSwitchCheckbox = themeToggleEl.querySelector(
          "#theme-switch"
        ) as Element;

        const handleRovingTabindexMainElement = (e) => {
          e.target.tabIndex = 0;
        };
        const handleRovingTabindexSecondaryElement = (e) => {
          e.target.tabIndex = -1;
        };

        themeSwitchCheckbox.addEventListener(
          "roving-tabindex:main-element",
          handleRovingTabindexMainElement
        );
        themeSwitchCheckbox.addEventListener(
          "roving-tabindex:secondary-element",
          handleRovingTabindexSecondaryElement
        );
      });
      window.frames[0].focus();
    }

    initOnReady();
  }, []);

  return <div id="tv_chart_container" />;
};

export default Chart;
