// Security utilities for the application
export class SecurityManager {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_INPUT_LENGTH = 1000;

  // Login attempt tracking
  static getLoginAttempts(identifier: string): number {
    const key = `login_attempts_${this.hashIdentifier(identifier)}`;
    const data = localStorage.getItem(key);
    if (!data) return 0;
    
    try {
      const { attempts, timestamp } = JSON.parse(data);
      
      // Reset if lockout period has passed
      if (Date.now() - timestamp > this.LOCKOUT_DURATION) {
        localStorage.removeItem(key);
        return 0;
      }
      
      return attempts;
    } catch {
      localStorage.removeItem(key);
      return 0;
    }
  }

  static recordFailedLogin(identifier: string): boolean {
    const attempts = this.getLoginAttempts(identifier) + 1;
    const key = `login_attempts_${this.hashIdentifier(identifier)}`;
    
    localStorage.setItem(key, JSON.stringify({
      attempts,
      timestamp: Date.now()
    }));
    
    return attempts >= this.MAX_LOGIN_ATTEMPTS;
  }

  static clearLoginAttempts(identifier: string): void {
    const key = `login_attempts_${this.hashIdentifier(identifier)}`;
    localStorage.removeItem(key);
  }

  static isAccountLocked(identifier: string): boolean {
    return this.getLoginAttempts(identifier) >= this.MAX_LOGIN_ATTEMPTS;
  }

  // Simple hash function for identifiers (not cryptographic, just for key generation)
  private static hashIdentifier(identifier: string): string {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // Enhanced input sanitization to prevent XSS and injection attacks
  static sanitizeInput(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim()
      .substring(0, this.MAX_INPUT_LENGTH);
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 255;
  }

  // Validate NIS format (numeric, reasonable length)
  static isValidNIS(nis: string): boolean {
    const nisRegex = /^[0-9]{4,20}$/;
    return nisRegex.test(nis);
  }

  // Validate password strength
  static isStrongPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: 'Password minimal 6 karakter' };
    }
    if (password.length > 100) {
      return { valid: false, message: 'Password terlalu panjang' };
    }
    return { valid: true };
  }

  // Rate limiting for API calls
  private static rateLimits = new Map<string, number[]>();

  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now();
    const requests = this.rateLimits.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    this.rateLimits.set(key, validRequests);
    return true;
  }
}