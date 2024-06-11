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

export const formatPrice = (value: number | string) => {
  value = value.toString();
  const priceNumber = parseFloat(value);
  const absValue = Math.abs(priceNumber);

  let digit: number;

  if (absValue < 1) {
    digit = 4;
  } else if (absValue < 10) {
    digit = 3;
  } else {
    digit = 2;
  }

  const formattedPrice = priceNumber.toLocaleString("en-US", {
    minimumFractionDigits: digit,
    maximumFractionDigits: digit,
  });

  return formattedPrice;
};
