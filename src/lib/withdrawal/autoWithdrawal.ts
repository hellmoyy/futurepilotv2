/**
 * AUTO WITHDRAWAL SYSTEM
 * 
 * Safe automatic withdrawal processing with:
 * - MongoDB transaction (ACID guarantees)
 * - Balance deduction AFTER successful blockchain transfer
 * - Automatic rollback on failure
 * - Status tracking and error logging
 * - Email notifications
 * 
 * Flow:
 * 1. Lock withdrawal (status = 'processing')
 * 2. Validate user balance
 * 3. Send blockchain transaction
 * 4. IF SUCCESS: Deduct balance + mark 'completed'
 * 5. IF FAILED: Rollback to 'pending' or 'failed'
 */

import mongoose from 'mongoose';
import { sendCommissionWithdrawal } from '@/lib/blockchain/commissionWallet';
import { Withdrawal } from '@/models/Withdrawal';
import { User } from '@/models/User';
import { notificationManager } from '@/lib/notifications/NotificationManager';

export interface WithdrawalResult {
  success: boolean;
  message: string;
  txHash?: string;
  error?: string;
  withdrawal?: any;
}

/**
 * Process automatic withdrawal with safety guarantees
 * 
 * @param withdrawalId - Withdrawal record ID
 * @param adminEmail - Admin who approved the withdrawal
 * @returns Result with success status and details
 */
export async function processAutoWithdrawal(
  withdrawalId: string,
  adminEmail: string
): Promise<WithdrawalResult> {
  
  // Start MongoDB session for transaction
  const session = await mongoose.startSession();
  
  try {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 1: START TRANSACTION & LOCK RECORD
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    await session.startTransaction();
    
    console.log('🔒 Locking withdrawal record...');
    
    // Find and lock withdrawal (must be 'pending')
    const withdrawal = await Withdrawal.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(withdrawalId),
        status: 'pending', // Only process pending withdrawals
      },
      {
        $set: {
          status: 'processing',
          processedAt: new Date(),
          processedBy: adminEmail,
        },
      },
      {
        new: true,
        session, // Use transaction session
      }
    );

    if (!withdrawal) {
      await session.abortTransaction();
      return {
        success: false,
        message: 'Withdrawal not found or already processed',
      };
    }

    console.log(`✅ Withdrawal locked: ${withdrawal._id}`);
    console.log(`   User: ${withdrawal.userId}`);
    console.log(`   Amount: $${withdrawal.amount}`);
    console.log(`   Wallet: ${withdrawal.walletAddress}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 2: VALIDATE USER BALANCE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('💰 Validating user balance...');
    
    const user = await User.findById(withdrawal.userId).session(session);
    
    if (!user) {
      await session.abortTransaction();
      return {
        success: false,
        message: 'User not found',
      };
    }

    const availableBalance = user.totalEarnings || 0;
    
    if (availableBalance < withdrawal.amount) {
      // Insufficient balance - rollback to pending
      await Withdrawal.findByIdAndUpdate(
        withdrawal._id,
        {
          $set: {
            status: 'pending',
            processedAt: undefined,
            processedBy: undefined,
            failureReason: `Insufficient balance. Available: $${availableBalance.toFixed(2)}, Required: $${withdrawal.amount}`,
          },
        },
        { session }
      );
      
      await session.commitTransaction();
      
      return {
        success: false,
        message: `Insufficient balance. User has $${availableBalance.toFixed(2)}, withdrawal requires $${withdrawal.amount}`,
      };
    }

    console.log(`   Available Balance: $${availableBalance}`);
    console.log(`   Withdrawal Amount: $${withdrawal.amount}`);
    console.log(`   ✅ Balance sufficient`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 3: BLOCKCHAIN TRANSFER (CRITICAL)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('📤 Sending blockchain transaction...');
    
    const transferResult = await sendCommissionWithdrawal(
      withdrawal.walletAddress,
      withdrawal.amount
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4A: TRANSFER FAILED - ROLLBACK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    if (!transferResult.success) {
      console.error('❌ Blockchain transfer failed:', transferResult.error);
      
      // Rollback to failed status (don't touch user balance)
      await Withdrawal.findByIdAndUpdate(
        withdrawal._id,
        {
          $set: {
            status: 'failed',
            failureReason: transferResult.error || 'Blockchain transfer failed',
            processedAt: new Date(),
          },
        },
        { session }
      );
      
      await session.commitTransaction();
      
      // Send failure notification to admin
      try {
        await notificationManager.send({
          userId: (user._id as any).toString(),
          type: 'system_alert',
          priority: 'error',
          title: 'Withdrawal Failed',
          message: `Blockchain transfer failed for $${withdrawal.amount} to ${withdrawal.walletAddress}: ${transferResult.error}`,
          channels: ['database', 'email'],
        });
      } catch (emailError) {
        console.error('Failed to send failure notification:', emailError);
      }
      
      return {
        success: false,
        message: `Blockchain transfer failed: ${transferResult.error}`,
        error: transferResult.error,
      };
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 4B: TRANSFER SUCCESS - DEDUCT BALANCE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.log('✅ Blockchain transfer successful!');
    console.log(`   TxHash: ${transferResult.txHash}`);
    console.log('💰 Deducting user balance...');

    // Atomic balance deduction
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $inc: { totalEarnings: -withdrawal.amount }, // Deduct balance
      },
      {
        new: true,
        session,
      }
    );

    if (!updatedUser) {
      // This should never happen, but if it does, abort transaction
      throw new Error('Failed to update user balance');
    }

    console.log(`   Previous Balance: $${availableBalance}`);
    console.log(`   New Balance: $${updatedUser.totalEarnings}`);

    // Update withdrawal to completed
    const completedWithdrawal = await Withdrawal.findByIdAndUpdate(
      withdrawal._id,
      {
        $set: {
          status: 'completed',
          transactionHash: transferResult.txHash,
          processedAt: new Date(),
          gasUsed: transferResult.gasUsed,
        },
      },
      {
        new: true,
        session,
      }
    );

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 5: COMMIT TRANSACTION (All or Nothing)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    await session.commitTransaction();
    
    console.log('✅ Transaction committed successfully!');
    console.log(`   Withdrawal ID: ${withdrawal._id}`);
    console.log(`   TxHash: ${transferResult.txHash}`);
    console.log(`   User Balance: $${updatedUser.totalEarnings}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // PHASE 6: POST-TRANSACTION NOTIFICATIONS
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    // Send success notification to user
    try {
      const networkMode = process.env.NETWORK_MODE || 'testnet';
      const explorerUrl = networkMode === 'mainnet'
        ? `https://etherscan.io/tx/${transferResult.txHash}`
        : `https://sepolia.etherscan.io/tx/${transferResult.txHash}`;

      await notificationManager.send({
        userId: (user._id as any).toString(),
        type: 'withdrawal_approved',
        priority: 'success',
        title: 'Withdrawal Completed',
        message: `Your withdrawal of $${withdrawal.amount} USDT has been completed! TxHash: ${transferResult.txHash}. View: ${explorerUrl}`,
        channels: ['database', 'email'],
      });
    } catch (emailError) {
      console.error('Failed to send success notification:', emailError);
    }

    return {
      success: true,
      message: 'Withdrawal processed successfully',
      txHash: transferResult.txHash,
      withdrawal: completedWithdrawal,
    };

  } catch (error: any) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // ERROR HANDLER - ROLLBACK EVERYTHING
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    console.error('❌ Fatal error during withdrawal processing:', error);
    
    await session.abortTransaction();
    
    // Try to mark withdrawal as failed
    try {
      await Withdrawal.findByIdAndUpdate(withdrawalId, {
        $set: {
          status: 'failed',
          failureReason: error.message,
          processedAt: new Date(),
        },
      });
    } catch (updateError) {
      console.error('Failed to update withdrawal status:', updateError);
    }

    return {
      success: false,
      message: `System error: ${error.message}`,
      error: error.message,
    };
    
  } finally {
    // Always end session
    await session.endSession();
  }
}
