// src/utils/logger.js

const winston = require('winston');
const config = require('../../config');

/**
 * Custom format for pretty console output
 */
const prettyFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
    })
);

/**
 * JSON format for production logging
 */
const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Create and configure Winston logger instance
 */
const logger = winston.createLogger({
    level: config.logging.level,
    format: config.logging.format === 'json' ? jsonFormat : prettyFormat,
    transports: [
        new winston.transports.Console()
    ],
    exitOnError: false
});

/**
 * Logger wrapper with contextual methods
 */
class Logger {
    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        logger.error(message, meta);
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        logger.warn(message, meta);
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        logger.info(message, meta);
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        logger.debug(message, meta);
    }

    /**
     * Create a child logger with a specific context
     * @param {string} context - Context name (e.g., 'CircuitBreaker', 'Retry')
     * @returns {Object} Child logger with context
     */
    child(context) {
        return {
            error: (message, meta = {}) => logger.error(message, { context, ...meta }),
            warn: (message, meta = {}) => logger.warn(message, { context, ...meta }),
            info: (message, meta = {}) => logger.info(message, { context, ...meta }),
            debug: (message, meta = {}) => logger.debug(message, { context, ...meta }),
        };
    }
}

module.exports = new Logger();
