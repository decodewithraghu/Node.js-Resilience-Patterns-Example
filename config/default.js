// config/default.js

/**
 * Default configuration for resilience patterns
 * These values are used in development and serve as base configuration.
 */

module.exports = {
    // Retry Policy Configuration
    retry: {
        maxAttempts: 6,
        initialDelay: 1000,      // ms
        maxDelay: 30000,         // ms
    },

    // Circuit Breaker Policy Configuration
    circuitBreaker: {
        failureThreshold: 3,     // Number of consecutive failures before opening circuit
        successThreshold: 2,     // Number of consecutive successes in half-open state to close circuit
        breakDuration: 10000,    // ms - How long circuit stays open before going half-open
    },

    // External API Endpoints
    apiEndpoints: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
        // Define your external API endpoints here
        users: process.env.API_USERS_URL || 'http://localhost:3000/api/users',
        orders: process.env.API_ORDERS_URL || 'http://localhost:3000/api/orders',
        products: process.env.API_PRODUCTS_URL || 'http://localhost:3000/api/products',
        // Add more endpoints as needed
    },

    // External API Service Simulation Configuration
    externalApi: {
        minLatency: 50,          // ms - Minimum simulated network latency
        maxLatency: 200,         // ms - Maximum simulated network latency
        transientFailureRate: 5, // % - Chance of transient failure even on expected success
        flakyFailureRate: 70,    // % - Failure rate after initial consecutive failures
        consecutiveFailureThreshold: 3, // Number of guaranteed failures before becoming flaky
    },

    // Logging Configuration
    logging: {
        level: 'debug',          // Log level: error, warn, info, debug
        format: 'pretty',        // Log format: pretty, json
        timestamp: true,
    },

    // Application Configuration
    app: {
        demoDelayBetweenGroups: 300,    // ms - Delay between call groups in flaky service phase
        demoDelayServiceDown: 1000,     // ms - Delay between calls when service is down
        demoDelayRecovery: 500,         // ms - Delay between calls during recovery phase
    }
};
