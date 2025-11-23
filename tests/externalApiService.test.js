// tests/externalApiService.test.js

const externalApiService = require('../src/services/externalApiService');

describe('External API Service', () => {
    beforeEach(() => {
        externalApiService.resetFailureCount();
    });

    describe('performIdempotentAction', () => {
        it('should succeed when isSuccessExpected is true', async () => {
            // May occasionally fail due to transient failure simulation
            // So we'll test the behavior pattern rather than single call
            const results = [];
            for (let i = 0; i < 10; i++) {
                try {
                    const result = await externalApiService.performIdempotentAction(true);
                    results.push(result);
                } catch (error) {
                    // Transient failures are expected occasionally
                }
            }
            
            // Most calls should succeed
            expect(results.length).toBeGreaterThan(5);
        });

        it('should fail consistently at first when isSuccessExpected is false', async () => {
            const failures = [];
            
            for (let i = 0; i < 3; i++) {
                try {
                    await externalApiService.performIdempotentAction(false);
                } catch (error) {
                    failures.push(error);
                }
            }
            
            expect(failures.length).toBe(3);
        });

        it('should return a promise', () => {
            const result = externalApiService.performIdempotentAction(true);
            expect(result).toBeInstanceOf(Promise);
        });
    });

    describe('performNonIdempotentAction', () => {
        it('should succeed when isSuccessExpected is true', async () => {
            const result = await externalApiService.performNonIdempotentAction(true);
            expect(result).toContain('Success');
        });

        it('should fail when isSuccessExpected is false', async () => {
            await expect(externalApiService.performNonIdempotentAction(false))
                .rejects.toThrow('Non-Idempotent API call failed');
        });
    });

    describe('resetFailureCount', () => {
        it('should reset internal failure state', async () => {
            // Cause some failures
            try {
                await externalApiService.performIdempotentAction(false);
            } catch (error) {
                // Expected
            }
            
            // Reset
            externalApiService.resetFailureCount();
            
            // Next failure should be counted as first failure again
            try {
                await externalApiService.performIdempotentAction(false);
            } catch (error) {
                expect(error.message).toContain('Simulated Failure 1');
            }
        });
    });
});
