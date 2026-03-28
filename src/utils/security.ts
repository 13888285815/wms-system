/**
 * Security utilities - XSS prevention, input sanitization, rate limiting
 */

// ─── Input Sanitization ───────────────────────────────────────────────────────

/**
 * Strip all HTML tags and dangerous characters from user input
 * Pure-JS implementation (no DOMPurify dependency needed for text-only fields)
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;')
    .trim()
    .slice(0, 1000); // max length guard
}

/**
 * Sanitize and validate email addresses
 */
export function sanitizeEmail(email: string): string {
  const cleaned = email.replace(/[^a-zA-Z0-9@._+-]/g, '').toLowerCase().slice(0, 254);
  return cleaned;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return re.test(email) && email.length <= 254;
}

/**
 * Sanitize numeric input - returns 0 for invalid values
 */
export function sanitizeNumber(input: unknown, min = 0, max = 999999999): number {
  const n = Number(input);
  if (!isFinite(n) || isNaN(n)) return 0;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

/**
 * Sanitize a whole form object - applies sanitizeText to all string fields
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (typeof value === 'number') {
      result[key] = sanitizeNumber(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Simple in-memory rate limiter
 * @param key     unique action identifier (e.g. 'login:user@example.com')
 * @param limit   max attempts per window
 * @param windowMs window duration in ms (default 60s)
 * @returns true if allowed, false if rate-limited
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

// ─── CSRF Token ───────────────────────────────────────────────────────────────

let _csrfToken: string | null = null;

export function getCsrfToken(): string {
  if (!_csrfToken) {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    _csrfToken = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('csrf_token', _csrfToken);
  }
  return _csrfToken;
}

export function validateCsrfToken(token: string): boolean {
  return token === sessionStorage.getItem('csrf_token');
}

// ─── Password Strength ────────────────────────────────────────────────────────

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  return { score: score as 0|1|2|3|4, label: labels[score], color: colors[score] };
}

// ─── Content Security Policy (meta tag injection) ─────────────────────────────

export function injectCSPMeta(): void {
  if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) return;
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // needed for Vite/React
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

// ─── SQL / NoSQL injection pattern detection ──────────────────────────────────

const INJECTION_PATTERNS = [
  /('|"|;|--|\/\*|\*\/|xp_|exec\s|union\s+select|drop\s+table|insert\s+into|delete\s+from|update\s+\w+\s+set)/i,
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /data:text\/html/i,
];

export function containsInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(p => p.test(input));
}

/**
 * Safe guard for any user input before storage
 */
export function guardInput(input: string, fieldName = 'field'): { safe: boolean; reason?: string; value: string } {
  if (containsInjection(input)) {
    return { safe: false, reason: `${fieldName} contains invalid characters`, value: '' };
  }
  return { safe: true, value: sanitizeText(input) };
}
