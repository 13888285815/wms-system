/**
 * Security utilities - XSS prevention, input sanitization, rate limiting, and secure token generation
 */

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Strip all HTML tags and dangerous characters from user input
 * Limits to 500 characters
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  
  // Remove HTML tags
  const noTags = input.replace(/<[^>]*>?/gm, '');
  
  return noTags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .trim()
    .slice(0, 500); // restricted to 500 chars as requested
}

/**
 * Strict email sanitization and validation
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  // Only allow valid email characters
  const cleaned = email.replace(/[^a-zA-Z0-9@._+-]/g, '').toLowerCase().trim();
  return cleaned.slice(0, 254);
}

/**
 * Validate email format strictly
 */
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 254;
}

/**
 * Recursive sanitization for storage
 */
export function sanitizeForStorage<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeText(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(v => sanitizeForStorage(v)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = sanitizeForStorage((obj as any)[key]);
      }
    }
    return result as T;
  }
  
  return obj;
}

/**
 * Validate password strength: 8+ chars, letters and numbers
 */
export function validatePassword(pwd: string): { valid: boolean; message: string } {
  if (pwd.length < 8) {
    return { valid: false, message: '密码至少需要8个字符' };
  }
  if (!/[a-zA-Z]/.test(pwd) || !/[0-9]/.test(pwd)) {
    return { valid: false, message: '密码必须包含字母和数字' };
  }
  return { valid: true, message: '密码强度符合要求' };
}

// ─── Token Generation ─────────────────────────────────────────────────────────

/**
 * Generate a secure 32-byte hex token
 */
export function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 */
export function checkRateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function getRateLimitRemaining(key: string, limit = 5): number {
  const entry = rateLimitStore.get(key);
  if (!entry) return limit;
  return Math.max(0, limit - entry.count);
}

// ─── Content Security Policy ──────────────────────────────────────────────────

export function injectCSPMeta(): void {
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  document.head.prepend(meta);
}

// ─── Injection Detection ──────────────────────────────────────────────────────

const INJECTION_PATTERNS = [
  /('|"|;|--|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)/i,
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
  /\$where/i, // NoSQL
  /\{\s*\$ne/i, // NoSQL
  /\{\s*\$gt/i, // NoSQL
];

export function containsInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(input));
}

/**
 * Safe guard for any user input
 */
export function guardInput(input: string, fieldName = 'field'): { safe: boolean; reason?: string; value: string } {
  if (containsInjection(input)) {
    return { safe: false, reason: `${fieldName} 包含非法字符`, value: '' };
  }
  return { safe: true, value: sanitizeText(input) };
}
