export const numberToWords = (
  num,
  currency = "USD"
) => {
  if (num === 0) return "Zero";

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = ["", "Thousand", "Million", "Billion"];

  const convertChunk = (n) => {
    let str = "";
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str += teens[n - 10] + " ";
    } else if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0 && n < 10) {
      str += units[n] + " ";
    }
    return str.trim();
  };

  const convertToWords = (n) => {
    if (n === 0) return "Zero";
    let result = "";
    let scaleIndex = 0;
    let tempNum = Math.floor(n);

    while (tempNum > 0) {
      const chunk = tempNum % 1000;
      if (chunk > 0) {
        const chunkStr = convertChunk(chunk);
        result =
          chunkStr +
          (scales[scaleIndex] ? " " + scales[scaleIndex] : "") +
          " " +
          result;
      }
      tempNum = Math.floor(tempNum / 1000);
      scaleIndex++;
    }
    return result.trim();
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let mainUnit = "Dollars";
  let subUnit = "Cents";

  if (currency === "INR") {
    mainUnit = "Rupees";
    subUnit = "Paise";
  } else if (currency === "CAD") {
    mainUnit = "Dollars";
    subUnit = "Cents";
  }

  let finalResult = `${convertToWords(integerPart)} ${mainUnit}`;
  if (decimalPart > 0) {
    finalResult += ` and ${convertToWords(decimalPart)} ${subUnit}`;
  }

  return finalResult;
};
