// Security utilities for the application
export class SecurityManager {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  static getLoginAttempts(email: string): number {
    const key = `login_attempts_${email}`;
    const data = localStorage.getItem(key);
    if (!data) return 0;
    
    const { attempts, timestamp } = JSON.parse(data);
    
    // Reset if lockout period has passed
    if (Date.now() - timestamp > this.LOCKOUT_DURATION) {
      localStorage.removeItem(key);
      return 0;
    }
    
    return attempts;
  }

  static recordFailedLogin(email: string): boolean {
    const attempts = this.getLoginAttempts(email) + 1;
    const key = `login_attempts_${email}`;
    
    localStorage.setItem(key, JSON.stringify({
      attempts,
      timestamp: Date.now()
    }));
    
    return attempts >= this.MAX_LOGIN_ATTEMPTS;
  }

  static clearLoginAttempts(email: string): void {
    const key = `login_attempts_${email}`;
    localStorage.removeItem(key);
  }

  static isAccountLocked(email: string): boolean {
    return this.getLoginAttempts(email) >= this.MAX_LOGIN_ATTEMPTS;
  }

  // Sanitize user input to prevent XSS
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 1000); // Limit length
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