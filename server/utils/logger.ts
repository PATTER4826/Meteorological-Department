/**
 * 🇹🇭 Thai Weather & Disaster AI Center
 * Safe Production Logger with Secret Sanitization
 * Strictly conforms to: [INFO], [WARN], [ERROR], [ALERT], [WORKER]
 */

export class Logger {
  private static sanitize(msg: string): string {
    if (!msg || typeof msg !== 'string') return msg;

    let sanitized = msg;

    // Sanitize database / redis URLs with passwords
    sanitized = sanitized.replace(/(postgres|postgresql|mysql|redis|rediss):\/\/([^:]+):([^@]+)@/gi, '$1://$2:***@');

    // Sanitize Discord tokens (typically 3 parts separated by dots, 59-72 chars)
    sanitized = sanitized.replace(/([a-zA-Z0-9_-]{24,28}\.[a-zA-Z0-9_-]{6}\.[a-zA-Z0-9_-]{27,38})/g, '***DISCORD_TOKEN***');

    // Sanitize Webhook URLs token part: https://discord.com/api/webhooks/ID/TOKEN
    sanitized = sanitized.replace(/(https:\/\/discord\.com\/api\/webhooks\/\d+\/)[a-zA-Z0-9_-]+/gi, '$1***WEBHOOK_SECRET***');

    // Sanitize known API key strings if set in environment
    const sensitiveEnvKeys = [
      process.env.DISCORD_TOKEN,
      process.env.GEMINI_API_KEY,
      process.env.WEATHER_API_KEY,
      process.env.TMD_API_KEY,
      process.env.AIR4THAI_API_KEY
    ];

    for (const secret of sensitiveEnvKeys) {
      if (secret && secret.trim().length > 5) {
        sanitized = sanitized.replaceAll(secret.trim(), '***REDACTED***');
      }
    }

    return sanitized;
  }

  private static format(level: string, message: string): string {
    const time = new Date().toISOString().replace('Z', '+07:00').substring(11, 19);
    return `[${time}] [${level}] ${this.sanitize(message)}`;
  }

  public static info(message: string, ...args: any[]) {
    console.log(this.format('INFO', message), ...args);
  }

  public static warn(message: string, ...args: any[]) {
    console.warn(this.format('WARN', message), ...args);
  }

  public static error(message: string, ...args: any[]) {
    console.error(this.format('ERROR', message), ...args);
  }

  public static alert(message: string, ...args: any[]) {
    console.log(this.format('ALERT', message), ...args);
  }

  public static worker(message: string, ...args: any[]) {
    console.log(this.format('WORKER', message), ...args);
  }
}

export const logger = Logger;
