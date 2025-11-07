/*
Import backtest trades into AIDecision + LearningPattern collections
USAGE (dry-run):
  node scripts/import-backtest-to-learning.js path/to/backtest.json
To actually write to DB:
  node scripts/import-backtest-to-learning.js path/to/backtest.json --apply --userId=<userId> --userBotId=<userBotId>

Notes:
- By default the script runs in dry-run mode and will print what it would insert.
- Provide --apply to actually insert documents.
- Optional --userId and --userBotId to override ownership. If not provided the script will pick the first user and first userBot found.
*/

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const argv = require('minimist')(process.argv.slice(2));

async function main() {
  const file = argv._[0];
  if (!file) {
    console.error('Usage: node scripts/import-backtest-to-learning.js <backtest.json> [--apply] [--userId=] [--userBotId=]');
    process.exit(1);
  }

  const apply = !!argv.apply;
  const userIdArg = argv.userId;
  const userBotIdArg = argv.userBotId;

  const fullPath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(fullPath)) {
    console.error('File not found:', fullPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(fullPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse JSON:', err.message);
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'futurepilotcols' }));
  const UserBot = mongoose.model('UserBot', new mongoose.Schema({}, { strict: false, collection: 'userbots' }));
  const AIDecision = mongoose.model('AIDecision', new mongoose.Schema({}, { strict: false, collection: 'aidecisions' }));
  const LearningPattern = mongoose.model('LearningPattern', new mongoose.Schema({}, { strict: false, collection: 'learningpatterns' }));

  let userId = userIdArg;
  let userBotId = userBotIdArg;

  if (!userId) {
    const u = await User.findOne().lean();
    if (!u) {
      console.error('No users found in DB. Please supply --userId');
      process.exit(1);
    }
    userId = u._id;
    console.log('Using userId:', userId);
  }

  if (!userBotId) {
    const ub = await UserBot.findOne().lean();
    if (!ub) {
      console.error('No userbots found in DB. Please supply --userBotId');
      process.exit(1);
    }
    userBotId = ub._id;
    console.log('Using userBotId:', userBotId);
  }

  const trades = json.original?.trades || json.trades || [];
  console.log('Found', trades.length, 'trades in backtest file');

  let insertedDecisions = 0;
  let upsertedPatterns = 0;

  for (const t of trades) {
    const signal = {
      symbol: json.config?.symbol || 'UNKNOWN',
      action: t.side || (t.pnl > 0 ? 'LONG' : 'SHORT'),
      technicalConfidence: (t.confidence || 50) / 100,
      entryPrice: t.entryPrice,
      stopLoss: t.entryPrice * (1 - (t.stopLossPercent || 0) / 100),
      takeProfit: t.exitPrice || null,
      indicators: {
        rsi: t.indicators?.rsi,
        macd: t.indicators?.macd?.histogram || t.indicators?.macd?.macd,
        adx: t.indicators?.adx,
        volume: t.indicators?.volume,
      },
    };

    const decisionDoc = {
      userId: mongoose.Types.ObjectId(userId),
      userBotId: mongoose.Types.ObjectId(userBotId),
      signalId: `backtest:${json.config?.startDate || 'unknown'}:${t.entryTime}`,
      signal,
      confidenceBreakdown: {
        technical: signal.technicalConfidence,
        news: 0,
        backtest: 1, // since this decision comes from backtest
        learning: 0,
        total: signal.technicalConfidence + 1,
      },
      decision: 'EXECUTE',
      reason: t.reason || 'imported from backtest',
      backtestContext: {
        recentWinRate: json.original?.metrics?.winRate ? Number(json.original.metrics.winRate) : undefined,
        recentTrades: json.original?.metrics?.totalTrades || trades.length,
        avgProfit: json.original?.metrics?.avgWin || undefined,
        avgLoss: json.original?.metrics?.avgLoss || undefined,
        performanceScore: json.original?.metrics?.roi || undefined,
      },
      execution: {
        executedAt: new Date(t.entryTime),
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        exitTime: t.exitTime ? new Date(t.exitTime) : undefined,
        profit: t.dollarPnL || t.pnl || undefined,
        profitPercent: t.pnl || undefined,
        duration: t.duration ? Math.round(t.duration / 60000) : undefined,
        exitType: t.exitReason || undefined,
        result: t.win ? 'WIN' : 'LOSS',
      },
      aiCost: 0,
      provider: 'backtest-import',
      aiModel: 'import-script',
      balanceSnapshot: {
        binanceBalance: 0,
        gasFeeBalance: 0,
        availableMargin: 0,
      },
      timestamp: t.entryTime ? new Date(t.entryTime) : new Date(),
    };

    if (apply) {
      await AIDecision.create(decisionDoc);
      insertedDecisions++;
    } else {
      console.log('DRY-RUN Decision:', JSON.stringify(decisionDoc, null, 2).substring(0, 600));
    }

    // Learning pattern: use reason or indicators to create a pattern key
    const patternKey = t.reason || `${signal.action}:${Math.round(signal.indicators?.rsi||0)}`;
    const patternQuery = { 'pattern.description': patternKey, userId: mongoose.Types.ObjectId(userId), userBotId: mongoose.Types.ObjectId(userBotId) };

    const existing = await LearningPattern.findOne(patternQuery).lean();
    if (existing) {
      if (apply) {
        // update occurrence metrics by using model method if available
        await LearningPattern.updateOne({ _id: existing._id }, {
          $inc: { occurrences: 1, successCount: t.win ? 1 : 0, failureCount: t.win ? 0 : 1, totalProfit: t.win ? (t.dollarPnL||0) : 0, totalLoss: t.win ? 0 : Math.abs(t.dollarPnL||t.pnl||0) },
          $set: { lastSeen: new Date(t.exitTime || t.entryTime) }
        });
        upsertedPatterns++;
      } else {
        console.log('DRY-RUN Would update existing pattern:', patternKey);
      }
    } else {
      const newPattern = {
        userId: mongoose.Types.ObjectId(userId),
        userBotId: mongoose.Types.ObjectId(userBotId),
        pattern: {
          type: t.win ? 'win' : 'loss',
          description: patternKey,
          conditions: {
            rsi: { min: t.indicators?.rsi ? Math.floor(t.indicators.rsi) : undefined, max: t.indicators?.rsi ? Math.ceil(t.indicators.rsi) : undefined },
            macd: { min: t.indicators?.macd?.histogram ? Math.floor(t.indicators.macd.histogram) : undefined, max: t.indicators?.macd?.histogram ? Math.ceil(t.indicators.macd.histogram) : undefined },
            trend: t.indicators?.trend || undefined,
            symbol: signal.symbol,
          }
        },
        occurrences: 1,
        successCount: t.win ? 1 : 0,
        failureCount: t.win ? 0 : 1,
        successRate: t.win ? 1 : 0,
        totalProfit: t.win ? (t.dollarPnL||0) : 0,
        totalLoss: t.win ? 0 : Math.abs(t.dollarPnL||t.pnl||0),
        netProfitLoss: t.win ? (t.dollarPnL||0) : -Math.abs(t.dollarPnL||t.pnl||0),
        avgProfit: t.win ? (t.dollarPnL||0) : 0,
        avgLoss: t.win ? 0 : Math.abs(t.dollarPnL||t.pnl||0),
        confidence: 0.05,
        strength: 10,
        timesMatched: 1,
        timesAvoided: 0,
        avoidanceSuccessRate: 0,
        firstSeen: new Date(t.entryTime),
        lastSeen: new Date(t.exitTime || t.entryTime),
        lastUpdated: new Date(),
        isActive: true,
        aiGenerated: false,
      };

      if (apply) {
        await LearningPattern.create(newPattern);
        upsertedPatterns++;
      } else {
        console.log('DRY-RUN New Pattern:', JSON.stringify(newPattern, null, 2));
      }
    }
  }

  console.log('\nSummary:');
  console.log('Decisions inserted:', insertedDecisions);
  console.log('Patterns upserted:', upsertedPatterns);

  await mongoose.connection.close();
  console.log('Done');
}

main().catch(err=>{console.error(err); process.exit(1)});
