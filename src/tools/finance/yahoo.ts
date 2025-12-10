import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import yahooFinance from 'yahoo-finance2';

const PriceSnapshotInputSchema = z.object({
    ticker: z
        .string()
        .describe(
            "The stock ticker symbol to fetch the price snapshot for. For example, 'AAPL' for Apple."
        ),
});

export const getYahooPriceSnapshot = new DynamicStructuredTool({
    name: 'get_price_snapshot',
    description: `(Free Tier) Fetches the most recent price snapshot for a specific stock using Yahoo Finance.`,
    schema: PriceSnapshotInputSchema,
    func: async (input) => {
        try {
            const result = await yahooFinance.quote(input.ticker) as any;
            return JSON.stringify({
                ticker: input.ticker,
                price: result.regularMarketPrice,
                day_change: result.regularMarketChange,
                day_change_percent: result.regularMarketChangePercent,
                time: result.regularMarketTime?.toISOString(),
                open: result.regularMarketOpen,
                high: result.regularMarketDayHigh,
                low: result.regularMarketDayLow,
                volume: result.regularMarketVolume,
            });
        } catch (error: any) {
            return JSON.stringify({ error: error.message });
        }
    },
});

const PricesInputSchema = z.object({
    ticker: z
        .string()
        .describe(
            "The stock ticker symbol to fetch aggregated prices for. For example, 'AAPL' for Apple."
        ),
    interval: z
        .enum(['minute', 'day', 'week', 'month', 'year'])
        .default('day')
        .describe("The time interval for price data. Defaults to 'day'."),
    interval_multiplier: z
        .number()
        .default(1)
        .describe('Multiplier for the interval. Defaults to 1.'),
    start_date: z.string().describe('Start date in YYYY-MM-DD format. Required.'),
    end_date: z.string().describe('End date in YYYY-MM-DD format. Required.'),
});

// Map standard intervals to Yahoo Finance intervals
const mapInterval = (interval: string): "1d" | "1wk" | "1mo" => {
    switch (interval) {
        case 'day': return '1d';
        case 'week': return '1wk';
        case 'month': return '1mo';
        default: return '1d'; // Fallback
    }
}

export const getYahooPrices = new DynamicStructuredTool({
    name: 'get_prices',
    description: `(Free Tier) Retrieves historical price data for a stock over a specified date range using Yahoo Finance.`,
    schema: PricesInputSchema,
    func: async (input) => {
        try {
            const queryOptions = {
                period1: input.start_date,
                period2: input.end_date,
                interval: mapInterval(input.interval),
            };
            const result = await yahooFinance.historical(input.ticker, queryOptions);
            return JSON.stringify(result);
        } catch (error: any) {
            return JSON.stringify({ error: error.message });
        }
    },
});
