// Simple cache utility for offline support and performance
class AppCache {
  private cacheName = 'tabungan-sekolah-v1';
  private maxAge = 5 * 60 * 1000; // 5 minutes

  async get(key: string): Promise<any> {
    try {
      const cached = localStorage.getItem(`${this.cacheName}-${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.maxAge) {
        this.delete(key);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, data: any): Promise<void> {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${this.cacheName}-${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(`${this.cacheName}-${key}`);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage);
      keys
        .filter(key => key.startsWith(this.cacheName))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }
}

export const cache = new AppCache();