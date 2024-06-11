export const closeLegend = () => {
  const iframe = document?.getElementsByTagName("iframe")[0] as any;
  iframe?.contentWindow?.document
    ?.querySelector("div[data-name=legend] > div:last-child > div:first-child")
    .click();
};
