import fs from 'node:fs';

const PROFIT_DATA =  fs.readFileSync('data2.csv', 'utf8');
const EXCHANGE_RATES = fs.readFileSync('exchange_rates-2023.csv', 'utf8');

// Constants for positions in the arrays
const PROFIT_DATE_INDEX = 0;
const PROFIT_VALUE_INDEX = 1;
const RATE_VALUE_INDEX = 0;
const RATE_DATE_INDEX = 1;

const normalizeDate = (dateTime) => {
  // if ita d/m/Y transform it to Y-m-d
  if (dateTime.match(/\d{2}\/\d{2}\/\d{4}/)) {
    const [day, month, year] = dateTime.split(' ')[0].split('/');
    return `${year}-${month}-${day}`;
  }
  return dateTime.split(' ')[0]; // Assumes date is always first part before any space
};

const parseData = (data, valueIndex, dateIndex) => {
  const lines = data.trim().split('\n');
  // lines.shift(); // Remove header
  return lines.map(line => {
    const parts = line.split('\t');
    return { 
      date: normalizeDate(parts[dateIndex].trim()), 
      value: parts[valueIndex].trim().replace(',', '.').replace(/[^\d.-]/g, '')
    };
  });
};

const buildRateMap = (rates) => {
  const rateMap = {};
  rates.forEach(rate => {
    rateMap[rate.date] = parseFloat(rate.value);
  });
  return rateMap;
};

const normalizeValue = (value) => {
  return parseFloat(value.replace(/[()]/g, '').replace('.', '.'));
};

const calculateTotalInEUR = (profits, rateMap) => {
  let totalEUR = 0;
  profits.forEach(profit => {
    if(!rateMap[profit.date]){
        throw new Error(`No exchange rate found for ${profit.date}`);
    }
    const rate = rateMap[profit.date];
    const normalizedProfit = normalizeValue(profit.value);
    totalEUR += normalizedProfit / rate;
  });
  return totalEUR;
};

const profits = parseData(PROFIT_DATA, PROFIT_VALUE_INDEX, PROFIT_DATE_INDEX);
const rates = parseData(EXCHANGE_RATES, RATE_VALUE_INDEX, RATE_DATE_INDEX);

const rateMap = buildRateMap(rates);

const totalInEUR = calculateTotalInEUR(profits, rateMap);
const totalInUSD = profits.reduce((total, profit) => {
    return total + normalizeValue(profit.value);
}, 0);
console.log(`Total in EUR: ${totalInEUR.toFixed(2)}`);
console.log(`Total in USD: ${totalInUSD.toFixed(2)}`);