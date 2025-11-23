// config/test.js

/**
 * Test configuration with faster timings for unit tests
 */

module.exports = {
    // Faster retry for testing
    retry: {
        maxAttempts: 3,
        initialDelay: 100,      // ms - Much faster for tests
        maxDelay: 1000,         // ms
    },

    // Faster circuit breaker for testing
    circuitBreaker: {
        failureThreshold: 2,
        successThreshold: 1,
        breakDuration: 500,     // ms - Much shorter for tests
    },

    // Faster simulation for testing
    externalApi: {
        minLatency: 10,
        maxLatency: 50,
        transientFailureRate: 5,
        flakyFailureRate: 70,
        consecutiveFailureThreshold: 3,
    },

    // Test logging
    logging: {
        level: 'error',         // Only errors in tests to reduce noise
        format: 'json',
        timestamp: true,
    },

    // Test app configuration
    app: {
        demoDelayBetweenGroups: 50,
        demoDelayServiceDown: 100,
        demoDelayRecovery: 50,
    }
};
