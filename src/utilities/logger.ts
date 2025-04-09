import type { FastifyBaseLogger } from "fastify";

class Logger {
  private static globalLogger: FastifyBaseLogger;

  static setLogger(logger: FastifyBaseLogger) {
    this.globalLogger = logger;
  }

  static getLogger() {
    return this.globalLogger || console;
  }

  static info(message: string, ...args: any[]) {
    const logger = this.getLogger();
    logger.info(message, ...args);
  }

  static warn(message: string, ...args: any[]) {
    const logger = this.getLogger();
    logger.warn(message, ...args);
  }

  static error(message: string, ...args: any[]) {
    const logger = this.getLogger();
    logger.error(message, ...args);
  }

  static fatal(message: string, ...args: any[]) {
    const logger = this.getLogger();
    logger.fatal(message, ...args);
  }
}

export default Logger;