export const getFinalValue = (value: number) => {
  if (value === undefined) {
    return 0;
  }

  const digit = getDigitFromValue(value);
  let formattedValue = value.toFixed(digit);
  formattedValue = parseFloat(formattedValue).toString();
  return formattedValue;
};

export const getDigitFromValue = (value: number) => {
  const absValue = Math.abs(value);

  if (absValue < 1) {
    return 4;
  }

  if (absValue < 10) {
    return 3;
  }

  return 2;
};

export const formatPriceVND = (input: number | string, isTrunc = true) => {
  if (!input) return "";
  input = isTrunc ? Math.trunc(Number(input)) : input;
  return input
    .toString()
    .replace(/,/g, "")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
