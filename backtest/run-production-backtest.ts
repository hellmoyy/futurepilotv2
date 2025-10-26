/**
 * 🎯 Production Backtest Runner (TypeScript)
 * 
 * Uses ACTUAL production strategy code:
 * - BitcoinProStrategy.ts ✅
 * - TradingEngine.ts ✅
 * - SafetyManager.ts ✅
 * - All improvements ✅
 */

import { BitcoinProStrategy } from '../src/lib/trading/BitcoinProStrategy';
import { TradeSignal } from '../src/lib/trading/TradingEngine';

const BinanceDataFetcher = require('./BinanceDataFetcher');
const MetricsCalculator = require('./MetricsCalculator');
const ReportGenerator = require('./ReportGenerator');

// Mock Binance Client for backtest
class MockBinanceClient {
  private historicalData: any[];
  private currentIndex: number;
  private mockBalance: number;
  private mockPositions: any[];

  constructor(historicalData: any[], currentIndex: number = 0) {
    this.historicalData = historicalData;
    this.currentIndex = currentIndex;
    this.mockBalance = 10000;
    this.mockPositions = [];
  }

  async futuresKlines(params: any): Promise<any[]> {
    const { limit } = params;
    const endIndex = this.currentIndex + 1;
    const startIndex = Math.max(0, endIndex - limit);
    
    return this.historicalData.slice(startIndex, endIndex).map(candle => [
      candle.openTime,
      candle.open.toString(),
      candle.high.toString(),
      candle.low.toString(),
      candle.close.toString(),
      candle.volume.toString(),
      candle.closeTime,
      candle.quoteVolume.toString(),
      candle.trades,
      candle.takerBuyBaseVolume.toString(),
      candle.takerBuyQuoteVolume.toString()
    ]);
  }

  async futuresAccountBalance(): Promise<any[]> {
    return [{
      asset: 'USDT',
      balance: this.mockBalance.toString(),
      availableBalance: this.mockBalance.toString()
    }];
  }

  async futuresPositionRisk(): Promise<any[]> {
    return this.mockPositions;
  }

  async futuresOrder(params: any): Promise<any> {
    return {
      orderId: Date.now(),
      symbol: params.symbol,
      status: 'FILLED',
      ...params
    };
  }

  async futuresLeverage(params: any): Promise<any> {
    return { leverage: params.leverage, symbol: params.symbol };
  }

  async futuresMarginType(params: any): Promise<any> {
    return { marginType: params.marginType };
  }

  setIndex(index: number) {
    this.currentIndex = index;
  }

  setBalance(balance: number) {
    this.mockBalance = balance;
  }

  setPositions(positions: any[]) {
    this.mockPositions = positions;
  }
}

// Production Backtest Engine
class ProductionBacktest {
  private userId: string = 'backtest_user';
  private initialCapital: number;
  private currentBalance: number;
  private currentPosition: any = null;
  private trades: any[] = [];
  private equity: number[] = [];
  private mockBinance: MockBinanceClient;
  private strategy: BitcoinProStrategy;

  constructor(initialCapital: number = 10000) {
    this.initialCapital = initialCapital;
    this.currentBalance = initialCapital;
    this.equity = [initialCapital];
    this.mockBinance = new MockBinanceClient([], 0);
    
    // Create strategy with mock keys (will replace client)
    this.strategy = new BitcoinProStrategy(
      this.userId,
      'mock_key',
      'mock_secret',
      'backtest_instance'
    );
  }

  async run(historicalData: any[]) {
    console.log('\n🎯 Running PRODUCTION Strategy Backtest');
    console.log('=' .repeat(70));
    console.log(`📊 Using: src/lib/trading/BitcoinProStrategy.ts`);
    console.log(`💰 Initial Capital: $${this.initialCapital}`);
    console.log(`📈 Candles: ${historicalData.length}`);
    console.log('');

    // Update mock Binance with historical data
    this.mockBinance = new MockBinanceClient(historicalData, 0);
    
    // Inject mock Binance into strategy
    (this.strategy as any).binanceClient = this.mockBinance;

    // Run backtest loop
    for (let i = 200; i < historicalData.length; i++) {
      const candle = historicalData[i];
      
      // Update mock client
      this.mockBinance.setIndex(i);
      this.mockBinance.setBalance(this.currentBalance);

      // Check existing position
      if (this.currentPosition) {
        this.checkPosition(candle);
      }

      // Get signal from PRODUCTION strategy
      if (!this.currentPosition) {
        try {
          const signal: TradeSignal = await this.strategy.analyze();
          
          if ((signal.action === 'BUY' || signal.action === 'SELL') && signal.confidence >= 65) {
            this.enterPosition(signal, candle);
          }
        } catch (error: any) {
          // Skip errors
          if (i % 1000 === 0) {
            console.log(`⚠️ Warning at candle ${i}: ${error.message}`);
          }
        }
      }

      // Track equity
      const currentEquity = this.currentPosition
        ? this.currentBalance + this.calculateUnrealizedPnL(this.currentPosition, candle.close)
        : this.currentBalance;
      this.equity.push(currentEquity);

      // Progress
      if (i % 500 === 0) {
        const progress = ((i / historicalData.length) * 100).toFixed(1);
        process.stdout.write(`\r⏳ Progress: ${progress}% | Trades: ${this.trades.length} | Equity: $${currentEquity.toFixed(2)}`);
      }
    }

    // Close remaining position
    if (this.currentPosition) {
      const lastCandle = historicalData[historicalData.length - 1];
      this.closePosition(lastCandle, 'END_OF_BACKTEST');
    }

    console.log(`\n✅ Backtest complete! ${this.trades.length} trades executed\n`);

    return {
      trades: this.trades,
      finalCapital: this.currentBalance,
      equity: this.equity
    };
  }

  private enterPosition(signal: TradeSignal, candle: any) {
    const entryPrice = candle.close;
    const side = signal.action === 'BUY' ? 'LONG' : 'SHORT';
    const positionValue = (this.currentBalance * 10 / 100) * 10; // 10% with 10x leverage
    const quantity = positionValue / entryPrice;

    // Use ATR-based stop loss if available
    const stopLossPercent = signal.atr
      ? Math.max(2, Math.min(5, (signal.atr / entryPrice) * 100 * 2))
      : 3;

    const stopLoss = side === 'LONG'
      ? entryPrice * (1 - stopLossPercent / 100)
      : entryPrice * (1 + stopLossPercent / 100);

    const takeProfit = side === 'LONG'
      ? entryPrice * (1 + 6 / 100)
      : entryPrice * (1 - 6 / 100);

    this.currentPosition = {
      side,
      entryPrice,
      quantity,
      stopLoss,
      takeProfit,
      stopLossPercent,
      entryTime: candle.openTime,
      confidence: signal.confidence,
      reason: signal.reason,
      indicators: signal.indicators,
      regime: signal.indicators?.trend
    };
  }

  private checkPosition(candle: any) {
    const pos = this.currentPosition;
    const { high, low } = candle;

    if (pos.side === 'LONG') {
      if (low <= pos.stopLoss) {
        this.closePosition(candle, 'STOP_LOSS', pos.stopLoss);
      } else if (high >= pos.takeProfit) {
        this.closePosition(candle, 'TAKE_PROFIT', pos.takeProfit);
      }
    } else {
      if (high >= pos.stopLoss) {
        this.closePosition(candle, 'STOP_LOSS', pos.stopLoss);
      } else if (low <= pos.takeProfit) {
        this.closePosition(candle, 'TAKE_PROFIT', pos.takeProfit);
      }
    }
  }

  private closePosition(candle: any, exitReason: string, exitPrice?: number) {
    const pos = this.currentPosition;
    const closePrice = exitPrice || candle.close;

    let pnlPercent: number;
    if (pos.side === 'LONG') {
      pnlPercent = (closePrice - pos.entryPrice) / pos.entryPrice * 100;
    } else {
      pnlPercent = (pos.entryPrice - closePrice) / pos.entryPrice * 100;
    }

    pnlPercent *= 10; // 10x leverage

    const positionValue = (this.currentBalance * 10 / 100);
    const dollarPnL = positionValue * (pnlPercent / 100);

    this.currentBalance += dollarPnL;

    const trade = {
      side: pos.side,
      entryPrice: pos.entryPrice,
      exitPrice: closePrice,
      entryTime: pos.entryTime,
      exitTime: candle.openTime,
      duration: candle.openTime - pos.entryTime,
      pnl: pnlPercent,
      dollarPnL: dollarPnL,
      exitReason: exitReason,
      confidence: pos.confidence,
      stopLossPercent: pos.stopLossPercent,
      reason: pos.reason,
      indicators: pos.indicators,
      regime: pos.regime,
      win: dollarPnL > 0
    };

    this.trades.push(trade);
    this.currentPosition = null;
  }

  private calculateUnrealizedPnL(position: any, currentPrice: number): number {
    let pnlPercent: number;
    if (position.side === 'LONG') {
      pnlPercent = (currentPrice - position.entryPrice) / position.entryPrice * 100;
    } else {
      pnlPercent = (position.entryPrice - currentPrice) / position.entryPrice * 100;
    }

    pnlPercent *= 10; // 10x leverage
    const positionValue = (this.currentBalance * 10 / 100);
    return positionValue * (pnlPercent / 100);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, defaultValue: string) => {
    const index = args.indexOf(flag);
    return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
  };

  const config = {
    period: getArg('--period', '3m'),
    symbol: getArg('--symbol', 'BTCUSDT'),
    interval: getArg('--interval', '15m'),
    capital: parseInt(getArg('--capital', '10000')),
    html: args.includes('--html')
  };

  try {
    // Fetch data
    const fetcher = new BinanceDataFetcher();
    const dateRange = BinanceDataFetcher.getDateRange(config.period);
    
    const candles = await fetcher.fetchPeriod(
      config.symbol,
      config.interval,
      dateRange.start,
      dateRange.end
    );

    if (candles.length === 0) {
      console.error('❌ No data fetched!');
      return;
    }

    // Run production backtest
    const backtest = new ProductionBacktest(config.capital);
    const results = await backtest.run(candles);

    // Calculate metrics
    const metrics = MetricsCalculator.calculate(
      results.trades,
      config.capital,
      results.finalCapital,
      results.equity
    );

    // Generate report
    const testConfig = {
      startDate: dateRange.start.toISOString().split('T')[0],
      endDate: dateRange.end.toISOString().split('T')[0],
      interval: config.interval,
      initialCapital: config.capital,
      positionSize: 10,
      leverage: 10
    };

    ReportGenerator.printConsole(metrics, testConfig);

    // Save results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    ReportGenerator.saveToFile(
      { config: testConfig, metrics, trades: results.trades },
      `production_${config.symbol}_${config.period}_${timestamp}.json`
    );

    if (config.html) {
      ReportGenerator.generateHTML(
        metrics,
        results.trades,
        testConfig,
        `production_${config.symbol}_${config.period}_${timestamp}.html`
      );
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  }
}

main();
