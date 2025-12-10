import { getIncomeStatements, getBalanceSheets, getCashFlowStatements, getAllFinancialStatements } from './fundamentals.js';
import { getFilings, get10KFilingItems, get10QFilingItems, get8KFilingItems } from './filings.js';
import { getPriceSnapshot as getApiPriceSnapshot, getPrices as getApiPrices } from './prices.js';
import { getYahooPriceSnapshot, getYahooPrices } from './yahoo.js';
import { getFinancialMetricsSnapshot, getFinancialMetrics } from './metrics.js';
import { getNews } from './news.js';
import { getAnalystEstimates } from './estimates.js';
import { getSegmentedRevenues } from './segments.js';

// Determine which tools to use based on API key availability
const useApi = !!process.env.FINANCIAL_DATASETS_API_KEY;

export const getPriceSnapshot = useApi ? getApiPriceSnapshot : getYahooPriceSnapshot;
export const getPrices = useApi ? getApiPrices : getYahooPrices;

export {
    getIncomeStatements,
    getBalanceSheets,
    getCashFlowStatements,
    getAllFinancialStatements,
    getFilings,
    get10KFilingItems,
    get10QFilingItems,
    get8KFilingItems,
    getFinancialMetricsSnapshot,
    getFinancialMetrics,
    getNews,
    getAnalystEstimates,
    getSegmentedRevenues,
    getYahooPriceSnapshot,
    getYahooPrices
};


