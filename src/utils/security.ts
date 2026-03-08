// Security utilities for the application
export class SecurityManager {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_INPUT_LENGTH = 500;
  private static readonly STORAGE_PREFIX = 'sec_';

  // Login attempt tracking
  static getLoginAttempts(identifier: string): number {
    const key = `${this.STORAGE_PREFIX}la_${this.hashIdentifier(identifier)}`;
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      const { attempts, timestamp } = JSON.parse(data);
      if (Date.now() - timestamp > this.LOCKOUT_DURATION) {
        localStorage.removeItem(key);
        return 0;
      }
      return attempts;
    } catch {
      return 0;
    }
  }

  static recordFailedLogin(identifier: string): boolean {
    const attempts = this.getLoginAttempts(identifier) + 1;
    const key = `${this.STORAGE_PREFIX}la_${this.hashIdentifier(identifier)}`;
    try {
      localStorage.setItem(key, JSON.stringify({ attempts, timestamp: Date.now() }));
    } catch {
      // Storage full - ignore
    }
    return attempts >= this.MAX_LOGIN_ATTEMPTS;
  }

  static clearLoginAttempts(identifier: string): void {
    const key = `${this.STORAGE_PREFIX}la_${this.hashIdentifier(identifier)}`;
    localStorage.removeItem(key);
  }

  static isAccountLocked(identifier: string): boolean {
    return this.getLoginAttempts(identifier) >= this.MAX_LOGIN_ATTEMPTS;
  }

  private static hashIdentifier(identifier: string): string {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Enhanced input sanitization
  static sanitizeInput(input: string): string {
    if (!input) return '';
    // Only trim and limit length for auth inputs - don't HTML-encode as Supabase handles that
    return input.trim().substring(0, this.MAX_INPUT_LENGTH);
  }

  // Sanitize for display (XSS prevention)
  static sanitizeForDisplay(input: string): string {
    if (!input) return '';
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
      .substring(0, this.MAX_INPUT_LENGTH);
  }

  static isValidEmail(email: string): boolean {
    if (email.length > 255) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidNIS(nis: string): boolean {
    return /^[0-9]{4,20}$/.test(nis);
  }

  static isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) return { valid: false, message: 'Password minimal 6 karakter' };
    if (password.length > 100) return { valid: false, message: 'Password terlalu panjang' };
    return { valid: true };
  }

  // Rate limiting
  private static rateLimits = new Map<string, number[]>();

  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = (this.rateLimits.get(key) || []).filter(time => now - time < windowMs);
    
    if (requests.length >= maxRequests) return false;
    
    requests.push(now);
    this.rateLimits.set(key, requests);
    
    // Cleanup old keys periodically
    if (this.rateLimits.size > 100) {
      for (const [k, v] of this.rateLimits) {
        if (v.every(t => now - t > windowMs)) this.rateLimits.delete(k);
      }
    }
    
    return true;
  }

  // CSP nonce generation for inline scripts (if needed)
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}
