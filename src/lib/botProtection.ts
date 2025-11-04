/**
 * Advanced Bot Protection Utilities
 * 
 * Multiple layers of bot detection and prevention:
 * 1. Honeypot fields (invisible to humans, filled by bots)
 * 2. Timing analysis (detect too-fast submissions)
 * 3. Behavioral patterns (mouse movement, keyboard events)
 * 4. Browser fingerprinting (detect headless browsers)
 */

import crypto from 'crypto';

// ==========================================
// 1. HONEYPOT VALIDATION
// ==========================================

/**
 * Honeypot field names (invisible to humans)
 * Bots often auto-fill all fields
 */
export const HONEYPOT_FIELDS = {
  // Common field names that bots fill
  website: '',
  url: '',
  phone: '',
  company: '',
  // Hidden with CSS display:none
  address: '',
  zip: '',
};

/**
 * Check if honeypot was triggered (bot detected)
 * @param formData - Form data to check
 * @returns true if bot detected, false if human
 */
export function isHoneypotTriggered(formData: Record<string, any>): boolean {
  const honeypotKeys = Object.keys(HONEYPOT_FIELDS);
  
  for (const key of honeypotKeys) {
    // If any honeypot field has value, it's a bot
    if (formData[key] && formData[key] !== '') {
      console.warn(`🤖 Bot detected: Honeypot field "${key}" was filled`);
      return true;
    }
  }
  
  return false;
}

// ==========================================
// 2. TIMING ANALYSIS
// ==========================================

/**
 * Minimum time (seconds) required to fill a form naturally
 */
export const MIN_FORM_FILL_TIME = {
  login: 2,        // 2 seconds minimum
  register: 5,     // 5 seconds minimum (more fields)
  passwordReset: 2,
  contactForm: 3,
};

/**
 * Check if form was submitted too fast (bot-like behavior)
 * @param startTime - Timestamp when form was rendered
 * @param formType - Type of form ('login', 'register', etc)
 * @returns true if submitted too fast (bot), false if normal
 */
export function isSubmittedTooFast(
  startTime: number,
  formType: keyof typeof MIN_FORM_FILL_TIME
): boolean {
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const minimumTime = MIN_FORM_FILL_TIME[formType];
  
  if (elapsedSeconds < minimumTime) {
    console.warn(
      `🤖 Bot detected: Form submitted in ${elapsedSeconds.toFixed(2)}s (minimum: ${minimumTime}s)`
    );
    return true;
  }
  
  return false;
}

// ==========================================
// 3. BROWSER FINGERPRINTING
// ==========================================

/**
 * Generate browser fingerprint (client-side)
 * Detects headless browsers and automation tools
 */
export function generateBrowserFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    plugins: Array.from(navigator.plugins || []).map(p => p.name).join(','),
    canvas: getCanvasFingerprint(),
    webgl: getWebGLFingerprint(),
    // Check for headless browser indicators
    hasWebDriver: navigator.webdriver || false,
    hasChrome: !!(window as any).chrome,
    permissions: navigator.permissions ? 'granted' : 'denied',
  };
  
  return hashFingerprint(fingerprint);
}

/**
 * Get Canvas fingerprint (unique per device)
 */
function getCanvasFingerprint(): string {
  if (typeof document === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Browser Fingerprint', 2, 15);
    
    return canvas.toDataURL().slice(-50); // Last 50 chars
  } catch {
    return '';
  }
}

/**
 * Get WebGL fingerprint
 */
function getWebGLFingerprint(): string {
  if (typeof document === 'undefined') return '';
  
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';
    
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';
    
    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    
    return `${vendor}|${renderer}`;
  } catch {
    return '';
  }
}

/**
 * Hash fingerprint data into short string
 */
function hashFingerprint(data: any): string {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 16);
}

/**
 * Check if fingerprint indicates bot/automation
 */
export function isSuspiciousFingerprint(fingerprint: string): boolean {
  // This is a placeholder - implement actual checks
  // Real implementation would check against known bot fingerprints
  return false;
}

// ==========================================
// 4. BEHAVIORAL ANALYSIS (Client-Side)
// ==========================================

/**
 * Track user interactions (mouse, keyboard)
 * Bots typically don't have natural mouse movements
 */
export class BehaviorTracker {
  private mouseMovements: number = 0;
  private keyPresses: number = 0;
  private startTime: number = Date.now();
  private interactions: string[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.attachListeners();
    }
  }
  
  private attachListeners() {
    // Track mouse movements
    window.addEventListener('mousemove', () => {
      this.mouseMovements++;
    });
    
    // Track key presses
    window.addEventListener('keydown', () => {
      this.keyPresses++;
    });
    
    // Track clicks
    window.addEventListener('click', (e) => {
      this.interactions.push(`click:${Date.now() - this.startTime}`);
    });
  }
  
  /**
   * Check if behavior is human-like
   */
  isHumanLike(): boolean {
    const timeElapsed = (Date.now() - this.startTime) / 1000;
    
    // If no mouse movements or key presses, likely a bot
    if (this.mouseMovements === 0 && this.keyPresses === 0 && timeElapsed > 1) {
      console.warn('🤖 Bot detected: No human interactions');
      return false;
    }
    
    // Natural users have some mouse movement
    if (timeElapsed > 3 && this.mouseMovements < 5) {
      console.warn('🤖 Bot detected: Insufficient mouse movement');
      return false;
    }
    
    return true;
  }
  
  /**
   * Get behavior score (0-100)
   * Higher score = more human-like
   */
  getBehaviorScore(): number {
    const timeElapsed = (Date.now() - this.startTime) / 1000;
    let score = 50; // Start at neutral
    
    // Mouse movement score
    const mouseScore = Math.min(this.mouseMovements / 10, 30);
    score += mouseScore;
    
    // Keyboard score
    const keyScore = Math.min(this.keyPresses / 5, 20);
    score += keyScore;
    
    // Time-on-page score
    if (timeElapsed > 2 && timeElapsed < 300) {
      score += 10; // Bonus for reasonable time
    }
    
    return Math.min(Math.max(score, 0), 100);
  }
  
  /**
   * Get behavior summary for server logging
   */
  getSummary() {
    return {
      mouseMovements: this.mouseMovements,
      keyPresses: this.keyPresses,
      timeElapsed: (Date.now() - this.startTime) / 1000,
      interactions: this.interactions.length,
      score: this.getBehaviorScore(),
      isHumanLike: this.isHumanLike(),
    };
  }
}

// ==========================================
// 5. COMPOSITE BOT DETECTION
// ==========================================

export interface BotCheckResult {
  isBot: boolean;
  confidence: number; // 0-100
  reasons: string[];
  score: number;
}

/**
 * Comprehensive bot check combining all methods
 */
export function performBotCheck(data: {
  formData?: Record<string, any>;
  formType?: keyof typeof MIN_FORM_FILL_TIME;
  startTime?: number;
  browserFingerprint?: string;
  behaviorScore?: number;
}): BotCheckResult {
  const reasons: string[] = [];
  let botScore = 0; // 0 = human, 100 = definitely bot
  
  // 1. Check honeypot
  if (data.formData && isHoneypotTriggered(data.formData)) {
    botScore += 100; // Instant bot detection
    reasons.push('Honeypot field filled');
  }
  
  // 2. Check timing
  if (data.startTime && data.formType) {
    if (isSubmittedTooFast(data.startTime, data.formType)) {
      botScore += 50;
      reasons.push('Submitted too fast');
    }
  }
  
  // 3. Check behavior score
  if (data.behaviorScore !== undefined) {
    if (data.behaviorScore < 30) {
      botScore += 40;
      reasons.push('Low interaction score');
    } else if (data.behaviorScore < 50) {
      botScore += 20;
      reasons.push('Suspicious behavior patterns');
    }
  }
  
  // 4. Check browser fingerprint
  if (data.browserFingerprint) {
    if (isSuspiciousFingerprint(data.browserFingerprint)) {
      botScore += 30;
      reasons.push('Suspicious browser fingerprint');
    }
  }
  
  return {
    isBot: botScore >= 50, // 50+ score = likely bot
    confidence: Math.min(botScore, 100),
    reasons,
    score: botScore,
  };
}

// ==========================================
// 6. EXPORT UTILITIES
// ==========================================

/**
 * Get honeypot HTML fields (to include in forms)
 */
export function getHoneypotFields(): Record<string, string> {
  return { ...HONEYPOT_FIELDS };
}

/**
 * Log bot detection event
 */
export function logBotDetection(
  method: string,
  ip: string,
  userAgent: string,
  details?: any
) {
  console.warn('🤖 BOT DETECTED:', {
    timestamp: new Date().toISOString(),
    method,
    ip,
    userAgent,
    details,
  });
  
  // TODO: Send to logging service (Sentry, LogRocket, etc)
  // TODO: Store in database for analysis
  // TODO: Update IP reputation score
}
