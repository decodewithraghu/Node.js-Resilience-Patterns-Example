// tests/config.test.js

const config = require('../config');

describe('Configuration', () => {
    it('should load configuration object', () => {
        expect(config).toBeDefined();
        expect(typeof config).toBe('object');
    });

    describe('Retry configuration', () => {
        it('should have retry settings', () => {
            expect(config.retry).toBeDefined();
            expect(config.retry.maxAttempts).toBeGreaterThan(0);
            expect(config.retry.initialDelay).toBeGreaterThan(0);
            expect(config.retry.maxDelay).toBeGreaterThanOrEqual(config.retry.initialDelay);
        });
    });

    describe('Circuit Breaker configuration', () => {
        it('should have circuit breaker settings', () => {
            expect(config.circuitBreaker).toBeDefined();
            expect(config.circuitBreaker.failureThreshold).toBeGreaterThan(0);
            expect(config.circuitBreaker.successThreshold).toBeGreaterThan(0);
            expect(config.circuitBreaker.breakDuration).toBeGreaterThan(0);
        });
    });

    describe('External API configuration', () => {
        it('should have external API settings', () => {
            expect(config.externalApi).toBeDefined();
            expect(config.externalApi.minLatency).toBeGreaterThanOrEqual(0);
            expect(config.externalApi.maxLatency).toBeGreaterThanOrEqual(config.externalApi.minLatency);
        });
    });

    describe('Logging configuration', () => {
        it('should have logging settings', () => {
            expect(config.logging).toBeDefined();
            expect(config.logging.level).toBeDefined();
            expect(['error', 'warn', 'info', 'debug']).toContain(config.logging.level);
        });
    });

    describe('App configuration', () => {
        it('should have application settings', () => {
            expect(config.app).toBeDefined();
            expect(config.app.demoDelayBetweenGroups).toBeGreaterThanOrEqual(0);
        });
    });
});
