/**
 * Notification Email Templates for FuturePilot
 * Specific templates for each notification type
 */

import { generateBaseEmailTemplate } from './BaseEmailTemplate';

// Withdrawal Request Template
export function generateWithdrawalRequestEmail(data: {
  userName: string;
  amount: number;
  network: string;
  walletAddress: string;
}) {
  const maskedAddress = data.walletAddress.substring(0, 10) + '...' + data.walletAddress.substring(38);
  
  return generateBaseEmailTemplate({
    previewText: `Your withdrawal request of $${data.amount.toFixed(2)} is being processed`,
    title: '💰 Withdrawal Request Received',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>We have received your withdrawal request and it is currently being processed by our team.</p>
      
      <div class="email-info-box">
        <p style="margin: 0;"><strong>Withdrawal Details:</strong></p>
        <p style="margin: 5px 0 0 0;">Amount: <strong>$${data.amount.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Network: <strong>${data.network}</strong></p>
        <p style="margin: 5px 0 0 0;">Wallet: <code>${maskedAddress}</code></p>
      </div>
      
      <p>Our team will review your request within 24 hours. You will receive a confirmation email once your withdrawal has been processed.</p>
      
      <p><strong>What's Next?</strong></p>
      <ul style="margin-left: 20px;">
        <li>Admin review: 1-24 hours</li>
        <li>Processing: 5-30 minutes after approval</li>
        <li>Network confirmation: 2-5 minutes</li>
      </ul>
    `,
    ctaText: 'View Withdrawal Status',
    ctaUrl: 'https://futurepilot.pro/withdrawals',
    footerText: 'If you did not request this withdrawal, please contact support immediately.'
  });
}

// Withdrawal Approved Template
export function generateWithdrawalApprovedEmail(data: {
  userName: string;
  amount: number;
  network: string;
  walletAddress: string;
  txHash: string;
}) {
  const maskedAddress = data.walletAddress.substring(0, 10) + '...' + data.walletAddress.substring(38);
  const explorerUrl = data.network === 'ERC20' 
    ? `https://etherscan.io/tx/${data.txHash}`
    : `https://bscscan.com/tx/${data.txHash}`;
  
  return generateBaseEmailTemplate({
    previewText: `✅ Your withdrawal of $${data.amount.toFixed(2)} has been approved!`,
    title: '✅ Withdrawal Approved',
    content: `
      <p>Great news, <strong>${data.userName}</strong>!</p>
      
      <p>Your withdrawal has been approved and processed successfully. The funds have been sent to your wallet.</p>
      
      <div class="email-info-box" style="background-color: #f0fdf4; border-left-color: #22c55e;">
        <p style="margin: 0;"><strong>✅ Withdrawal Complete:</strong></p>
        <p style="margin: 5px 0 0 0;">Amount: <strong style="color: #22c55e;">$${data.amount.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Network: <strong>${data.network}</strong></p>
        <p style="margin: 5px 0 0 0;">Wallet: <code>${maskedAddress}</code></p>
        <p style="margin: 5px 0 0 0;">TxHash: <code style="font-size: 12px;">${data.txHash.substring(0, 20)}...</code></p>
      </div>
      
      <p>You can verify this transaction on the blockchain using the button below.</p>
    `,
    ctaText: 'View on Explorer',
    ctaUrl: explorerUrl,
    footerText: 'Please allow 2-5 minutes for network confirmations. Thank you for using FuturePilot!'
  });
}

// Withdrawal Rejected Template
export function generateWithdrawalRejectedEmail(data: {
  userName: string;
  amount: number;
  network: string;
  reason: string;
}) {
  return generateBaseEmailTemplate({
    previewText: `Your withdrawal request of $${data.amount.toFixed(2)} was rejected`,
    title: '❌ Withdrawal Request Rejected',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>Unfortunately, your withdrawal request has been rejected by our admin team.</p>
      
      <div class="email-info-box" style="background-color: #fef2f2; border-left-color: #ef4444;">
        <p style="margin: 0;"><strong>Withdrawal Details:</strong></p>
        <p style="margin: 5px 0 0 0;">Amount: <strong>$${data.amount.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Network: <strong>${data.network}</strong></p>
        <p style="margin: 10px 0 0 0;"><strong>Reason:</strong></p>
        <p style="margin: 5px 0 0 0; color: #991b1b;">${data.reason}</p>
      </div>
      
      <p>Your funds remain in your account and are available for trading or future withdrawal requests.</p>
      
      <p>If you have questions about this rejection, please contact our support team.</p>
    `,
    ctaText: 'Contact Support',
    ctaUrl: 'https://futurepilot.pro/support',
    footerText: 'Need help? Our support team is available 24/7 to assist you.'
  });
}

// Deposit Confirmed Template
export function generateDepositConfirmedEmail(data: {
  userName: string;
  amount: number;
  network: string;
  txHash: string;
  newBalance: number;
}) {
  const explorerUrl = data.network === 'ERC20' 
    ? `https://etherscan.io/tx/${data.txHash}`
    : `https://bscscan.com/tx/${data.txHash}`;
  
  return generateBaseEmailTemplate({
    previewText: `🎉 Deposit of $${data.amount.toFixed(2)} confirmed!`,
    title: '🎉 Deposit Confirmed',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>Your deposit has been confirmed and credited to your account!</p>
      
      <div class="email-info-box" style="background-color: #f0fdf4; border-left-color: #22c55e;">
        <p style="margin: 0;"><strong>💰 Deposit Details:</strong></p>
        <p style="margin: 5px 0 0 0;">Amount: <strong style="color: #22c55e;">+$${data.amount.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Network: <strong>${data.network}</strong></p>
        <p style="margin: 5px 0 0 0;">New Balance: <strong>$${data.newBalance.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">TxHash: <code style="font-size: 12px;">${data.txHash.substring(0, 20)}...</code></p>
      </div>
      
      <p>Your gas fee balance has been updated and you can now use it for trading!</p>
      
      <p><strong>What can you do now?</strong></p>
      <ul style="margin-left: 20px;">
        <li>Start automated trading with our bot</li>
        <li>Share your referral link to earn commissions</li>
        <li>Upgrade your tier for higher referral rates</li>
      </ul>
    `,
    ctaText: 'Start Trading',
    ctaUrl: 'https://futurepilot.pro/dashboard',
    footerText: 'Thank you for trusting FuturePilot with your trading journey!'
  });
}

// Tier Upgrade Template
export function generateTierUpgradeEmail(data: {
  userName: string;
  oldTier: string;
  newTier: string;
  newRates: {
    level1: number;
    level2: number;
    level3: number;
  };
  totalDeposit: number;
}) {
  const tierEmoji: Record<string, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎'
  };
  
  return generateBaseEmailTemplate({
    previewText: `🎉 Congratulations! You've been upgraded to ${data.newTier.toUpperCase()} tier!`,
    title: `${tierEmoji[data.newTier.toLowerCase()]} Tier Upgrade: ${data.newTier.toUpperCase()}`,
    content: `
      <p>Congratulations, <strong>${data.userName}</strong>! 🎊</p>
      
      <p>You have been upgraded from <strong>${data.oldTier}</strong> to <strong style="color: #667eea;">${data.newTier.toUpperCase()}</strong> tier!</p>
      
      <div class="email-info-box" style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-left-color: #667eea;">
        <p style="margin: 0;"><strong>${tierEmoji[data.newTier.toLowerCase()]} Your New Commission Rates:</strong></p>
        <p style="margin: 10px 0 0 0;">Level 1 Referrals: <strong style="color: #667eea; font-size: 18px;">${data.newRates.level1}%</strong></p>
        <p style="margin: 5px 0 0 0;">Level 2 Referrals: <strong style="color: #667eea;">${data.newRates.level2}%</strong></p>
        <p style="margin: 5px 0 0 0;">Level 3 Referrals: <strong style="color: #667eea;">${data.newRates.level3}%</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #4a5568;">Total Lifetime Deposits: <strong>$${data.totalDeposit.toFixed(2)}</strong></p>
      </div>
      
      <p>With your new tier, you'll earn higher commissions from all your referrals!</p>
      
      <p><strong>How to maximize your earnings:</strong></p>
      <ul style="margin-left: 20px;">
        <li>Share your referral link with friends and family</li>
        <li>Post on social media to reach more people</li>
        <li>Help your referrals succeed with trading tips</li>
      </ul>
    `,
    ctaText: 'View Referral Dashboard',
    ctaUrl: 'https://futurepilot.pro/referral',
    footerText: 'Keep growing your network and watch your passive income increase!'
  });
}

// Trading Profit Alert Template
export function generateTradingProfitEmail(data: {
  userName: string;
  profit: number;
  position: string;
  entryPrice: number;
  exitPrice: number;
  commission: number;
  netProfit: number;
}) {
  return generateBaseEmailTemplate({
    previewText: `🎯 Trade Closed: +$${data.netProfit.toFixed(2)} profit!`,
    title: '🎯 Trading Profit Alert',
    content: `
      <p>Great trade, <strong>${data.userName}</strong>! 💰</p>
      
      <p>Your automated trading bot just closed a profitable position!</p>
      
      <div class="email-info-box" style="background-color: #f0fdf4; border-left-color: #22c55e;">
        <p style="margin: 0;"><strong>📈 Position Details:</strong></p>
        <p style="margin: 5px 0 0 0;">Pair: <strong>${data.position}</strong></p>
        <p style="margin: 5px 0 0 0;">Entry: <strong>$${data.entryPrice.toFixed(2)}</strong></p>
        <p style="margin: 5px 0 0 0;">Exit: <strong style="color: #22c55e;">$${data.exitPrice.toFixed(2)}</strong></p>
        <p style="margin: 10px 0 5px 0;">Gross Profit: <strong>+$${data.profit.toFixed(2)}</strong></p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Platform Fee (20%): -$${data.commission.toFixed(2)}</p>
        <p style="margin: 5px 0 0 0;">Net Profit: <strong style="color: #22c55e; font-size: 18px;">+$${data.netProfit.toFixed(2)}</strong></p>
      </div>
      
      <p>Your bot continues to monitor the market for new opportunities. Keep your gas fee balance topped up for continuous trading!</p>
    `,
    ctaText: 'View Trading History',
    ctaUrl: 'https://futurepilot.pro/trading-history',
    footerText: 'Past performance does not guarantee future results. Trade responsibly.'
  });
}

// Referral Commission Earned Template
export function generateReferralCommissionEmail(data: {
  userName: string;
  referralName: string;
  amount: number;
  level: number;
  rate: number;
  totalEarnings: number;
}) {
  return generateBaseEmailTemplate({
    previewText: `💰 You earned $${data.amount.toFixed(2)} from ${data.referralName}'s deposit!`,
    title: '💰 Referral Commission Earned',
    content: `
      <p>Congratulations, <strong>${data.userName}</strong>!</p>
      
      <p>You just earned a referral commission from <strong>${data.referralName}</strong>'s deposit!</p>
      
      <div class="email-info-box" style="background-color: #fefce8; border-left-color: #eab308;">
        <p style="margin: 0;"><strong>💵 Commission Details:</strong></p>
        <p style="margin: 5px 0 0 0;">Referral: <strong>${data.referralName}</strong> (Level ${data.level})</p>
        <p style="margin: 5px 0 0 0;">Commission Rate: <strong>${data.rate}%</strong></p>
        <p style="margin: 5px 0 0 0;">Amount Earned: <strong style="color: #ca8a04; font-size: 18px;">+$${data.amount.toFixed(2)}</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">Total Lifetime Earnings: <strong>$${data.totalEarnings.toFixed(2)}</strong></p>
      </div>
      
      <p>Your commission is now available in your Available Commission balance and can be withdrawn at any time!</p>
      
      <p><strong>Grow your passive income:</strong></p>
      <ul style="margin-left: 20px;">
        <li>Invite more friends to join FuturePilot</li>
        <li>Upgrade your tier for higher commission rates</li>
        <li>Help your referrals succeed to earn more</li>
      </ul>
    `,
    ctaText: 'Withdraw Commission',
    ctaUrl: 'https://futurepilot.pro/referral',
    footerText: 'Keep sharing and earning! The sky is the limit! 🚀'
  });
}

// Low Gas Fee Balance Warning
export function generateLowBalanceWarningEmail(data: {
  userName: string;
  currentBalance: number;
  minimumRequired: number;
}) {
  return generateBaseEmailTemplate({
    previewText: `⚠️ Your gas fee balance is running low: $${data.currentBalance.toFixed(2)}`,
    title: '⚠️ Low Gas Fee Balance',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>Your gas fee balance is running low and may affect your trading activities.</p>
      
      <div class="email-info-box" style="background-color: #fffbeb; border-left-color: #f59e0b;">
        <p style="margin: 0;"><strong>⚠️ Balance Alert:</strong></p>
        <p style="margin: 5px 0 0 0;">Current Balance: <strong style="color: #d97706;">$${data.currentBalance.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Minimum Required: <strong>$${data.minimumRequired.toFixed(2)} USDT</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">⚡ Top up now to continue automated trading!</p>
      </div>
      
      <p>If your balance falls below $${data.minimumRequired.toFixed(2)}, your trading bot will automatically pause until you top up.</p>
      
      <p><strong>Why maintain gas fee balance?</strong></p>
      <ul style="margin-left: 20px;">
        <li>Continuous automated trading</li>
        <li>Never miss profitable opportunities</li>
        <li>Platform commission payments</li>
      </ul>
    `,
    ctaText: 'Top Up Now',
    ctaUrl: 'https://futurepilot.pro/topup',
    footerText: 'Keep your account active by maintaining sufficient gas fee balance.'
  });
}

// Trading Auto-Close Notification
export function generateTradingAutoCloseEmail(data: {
  userName: string;
  profit: number;
  threshold: number;
  gasFeeBalance: number;
  positionId: string;
}) {
  return generateBaseEmailTemplate({
    previewText: `⚠️ Position auto-closed: +$${data.profit.toFixed(2)} profit`,
    title: '⚠️ Position Auto-Closed',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p>Your trading position was automatically closed to protect your gas fee balance from going negative.</p>
      
      <div class="email-info-box" style="background-color: #fef3c7; border-left-color: #f59e0b;">
        <p style="margin: 0;"><strong>⚠️ Auto-Close Alert:</strong></p>
        <p style="margin: 5px 0 0 0;">Profit Secured: <strong style="color: #16a34a; font-size: 18px;">+$${data.profit.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Auto-Close Threshold: <strong>$${data.threshold.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Remaining Gas Fee: <strong style="color: #d97706;">$${data.gasFeeBalance.toFixed(2)} USDT</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #92400e;">Position ID: <code style="background: #fef3c7; padding: 2px 6px; border-radius: 4px;">${data.positionId}</code></p>
      </div>
      
      <p><strong>Why was this closed?</strong></p>
      <p>Our system detected that continuing the trade could deplete your gas fee balance. To prevent this, we automatically closed the position and secured your profit.</p>
      
      <p><strong>What should you do?</strong></p>
      <ul style="margin-left: 20px;">
        <li>✅ Your profit has been secured</li>
        <li>💰 Top up gas fee balance to continue trading</li>
        <li>📊 Review your trading dashboard for details</li>
      </ul>
      
      <p><strong>Important:</strong> Platform commission (20%) will be deducted from your gas fee balance as per our terms.</p>
    `,
    ctaText: 'View Trading Dashboard',
    ctaUrl: 'https://futurepilot.pro/automation',
    footerText: 'Auto-close protection ensures you never go into negative balance.'
  });
}

// Low Gas Fee Trading Warning
export function generateLowGasFeeWarningEmail(data: {
  userName: string;
  currentBalance: number;
}) {
  return generateBaseEmailTemplate({
    previewText: `🚨 Cannot trade: Gas fee balance too low ($${data.currentBalance.toFixed(2)})`,
    title: '🚨 Trading Paused: Low Gas Fee Balance',
    content: `
      <p>Hi <strong>${data.userName}</strong>,</p>
      
      <p><strong>Your automated trading has been paused</strong> because your gas fee balance is below the minimum required amount.</p>
      
      <div class="email-info-box" style="background-color: #fee2e2; border-left-color: #ef4444;">
        <p style="margin: 0;"><strong>🚨 Critical Alert:</strong></p>
        <p style="margin: 5px 0 0 0;">Current Balance: <strong style="color: #dc2626; font-size: 18px;">$${data.currentBalance.toFixed(2)} USDT</strong></p>
        <p style="margin: 5px 0 0 0;">Minimum Required: <strong>$10.00 USDT</strong></p>
        <p style="margin: 10px 0 0 0; font-size: 14px; color: #991b1b;">⚠️ Trading will resume automatically after topup</p>
      </div>
      
      <p><strong>Why do I need gas fee balance?</strong></p>
      <ul style="margin-left: 20px;">
        <li>💼 Platform commission payments (20% of profits)</li>
        <li>🤖 Automated trading operations</li>
        <li>⚡ Continuous bot monitoring</li>
        <li>📊 Real-time position management</li>
      </ul>
      
      <p><strong>How to resume trading:</strong></p>
      <ol style="margin-left: 20px;">
        <li>Top up gas fee balance (minimum $10 USDT)</li>
        <li>Wait for confirmation (usually instant)</li>
        <li>Trading bot will automatically resume</li>
      </ol>
      
      <p style="padding: 15px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">
        <strong style="color: #1e40af;">💡 Pro Tip:</strong> Keep at least $50 USDT in gas fee balance for uninterrupted trading and maximum profit potential!
      </p>
    `,
    ctaText: 'Top Up Gas Fee Balance',
    ctaUrl: 'https://futurepilot.pro/topup',
    footerText: 'Resume trading in minutes with a quick top-up!'
  });
}
