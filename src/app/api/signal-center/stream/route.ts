import { NextRequest } from 'next/server';
import { signalBroadcaster } from '@/lib/signal-center';
import type { TradingSignal } from '@/lib/signal-center/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max connection

/**
 * Server-Sent Events (SSE) endpoint for real-time signal streaming
 * 
 * Phase 4: Real-time WebSocket Implementation
 * - Using SSE instead of WebSocket (simpler, built-in reconnection)
 * - Streams signals to browser clients in real-time
 * - No polling needed, instant updates
 * 
 * Usage in client:
 * const eventSource = new EventSource('/api/signal-center/stream');
 * eventSource.addEventListener('signal', (e) => {
 *   const signal = JSON.parse(e.data);
 *   console.log('New signal:', signal);
 * });
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      console.log('🟢 SSE Client connected');
      
      // Send initial connection message
      const connectMsg = `data: ${JSON.stringify({ type: 'connected', message: 'Signal stream connected' })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));
      
      // Subscribe to signal broadcaster
      const handleSignal = (signal: TradingSignal) => {
        console.log('📡 Broadcasting signal to SSE client:', signal.symbol, signal.action);
        
        try {
          const signalMsg = `event: signal\ndata: ${JSON.stringify(signal)}\n\n`;
          controller.enqueue(encoder.encode(signalMsg));
        } catch (error) {
          console.error('❌ Error encoding signal:', error);
        }
      };
      
      // Register listener
      signalBroadcaster.on('signal', handleSignal);
      
      // Send heartbeat every 30 seconds to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMsg = `event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeatMsg));
        } catch (error) {
          console.error('❌ Heartbeat failed:', error);
          clearInterval(heartbeat);
        }
      }, 30000);
      
      // Cleanup on client disconnect
      req.signal.addEventListener('abort', () => {
        console.log('🔴 SSE Client disconnected');
        signalBroadcaster.off('signal', handleSignal);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });
  
  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
