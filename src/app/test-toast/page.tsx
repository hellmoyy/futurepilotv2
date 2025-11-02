/**
 * Toast Notification Test Page
 * Demo page untuk testing toast notifications
 */

'use client';

import { useToastNotifications } from '@/contexts/ToastContext';
import { useTradingNotifications, useTierNotifications } from '@/hooks/useNotifications';

export default function ToastTestPage() {
  const { showInfo, showSuccess, showWarning, showError } = useToastNotifications();
  const {
    notifyCommissionDeducted,
    notifyAutoClose,
    notifyLowGasFee,
    notifyPositionOpened,
    notifyPositionClosed,
  } = useTradingNotifications();
  const { notifyTierUpgrade } = useTierNotifications();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Toast Notification Test</h1>
        <p className="text-gray-400 mb-8">Click buttons below to test different toast types</p>

        {/* Basic Toast Types */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Toast Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => showInfo('Information', 'This is an info message with some details')}
              className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium"
            >
              💡 Info Toast
            </button>
            <button
              onClick={() => showSuccess('Success!', 'Operation completed successfully')}
              className="px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium"
            >
              ✅ Success Toast
            </button>
            <button
              onClick={() => showWarning('Warning', 'Please review this important information')}
              className="px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-medium"
            >
              ⚠️ Warning Toast
            </button>
            <button
              onClick={() => showError('Error', 'Something went wrong. Please try again.')}
              className="px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-medium"
            >
              🚨 Error Toast
            </button>
          </div>
        </div>

        {/* Toast with Actions */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Toast with Action Links</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => showSuccess('Transaction Complete', 'Your transaction has been processed', {
                link: '/transactions',
                actionLabel: 'View Details',
              })}
              className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-medium"
            >
              With Action Link
            </button>
            <button
              onClick={() => showWarning('Update Available', 'A new version is available for download', {
                link: '/settings',
                actionLabel: 'Update Now',
                duration: 10000,
              })}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition font-medium"
            >
              Long Duration (10s)
            </button>
          </div>
        </div>

        {/* Trading Notifications */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Trading Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => notifyCommissionDeducted(10, 50, 20)}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
            >
              Commission Deducted
            </button>
            <button
              onClick={() => notifyAutoClose(45.50)}
              className="px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition font-medium text-sm"
            >
              Auto-Close Position
            </button>
            <button
              onClick={() => notifyLowGasFee(8.5)}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
            >
              Low Gas Fee
            </button>
            <button
              onClick={() => notifyPositionOpened('BTCUSDT', 'LONG')}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
            >
              Position Opened
            </button>
            <button
              onClick={() => notifyPositionClosed('ETHUSDT', 25.75)}
              className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium text-sm"
            >
              Position Closed (Profit)
            </button>
            <button
              onClick={() => notifyPositionClosed('BNBUSDT', -15.30)}
              className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium text-sm"
            >
              Position Closed (Loss)
            </button>
          </div>
        </div>

        {/* Tier Notifications */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tier Upgrade Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <button
              onClick={() => notifyTierUpgrade('Bronze', 'Silver')}
              className="px-4 py-3 bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg transition font-medium text-sm"
            >
              Bronze → Silver
            </button>
            <button
              onClick={() => notifyTierUpgrade('Silver', 'Gold')}
              className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white rounded-lg transition font-medium text-sm"
            >
              Silver → Gold
            </button>
            <button
              onClick={() => notifyTierUpgrade('Gold', 'Platinum')}
              className="px-4 py-3 bg-gradient-to-r from-gray-300 to-blue-400 hover:from-gray-400 hover:to-blue-500 text-white rounded-lg transition font-medium text-sm"
            >
              Gold → Platinum
            </button>
          </div>
        </div>

        {/* Multiple Toasts */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Stress Test</h2>
          <button
            onClick={() => {
              showInfo('Toast 1', 'First notification');
              setTimeout(() => showSuccess('Toast 2', 'Second notification'), 300);
              setTimeout(() => showWarning('Toast 3', 'Third notification'), 600);
              setTimeout(() => showError('Toast 4', 'Fourth notification'), 900);
              setTimeout(() => showInfo('Toast 5', 'Fifth notification'), 1200);
            }}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition font-medium"
          >
            🚀 Show Multiple Toasts
          </button>
        </div>

        {/* Usage Examples */}
        <div className="bg-gray-800/50 rounded-xl p-6 mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Usage Examples</h2>
          <div className="space-y-4">
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Basic usage:</p>
              <code className="text-green-400 text-xs">
                {`const { showSuccess } = useToastNotifications();`}<br/>
                {`showSuccess('Title', 'Message');`}
              </code>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">With action link:</p>
              <code className="text-green-400 text-xs">
                {`showSuccess('Title', 'Message', {`}<br/>
                {`  link: '/page',`}<br/>
                {`  actionLabel: 'View Details',`}<br/>
                {`  duration: 8000`}<br/>
                {`});`}
              </code>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg">
              <p className="text-gray-400 text-sm mb-2">Trading notifications:</p>
              <code className="text-green-400 text-xs">
                {`const { notifyAutoClose } = useTradingNotifications();`}<br/>
                {`notifyAutoClose(45.50); // profit amount`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
