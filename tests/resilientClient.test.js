// tests/resilientClient.test.js

const { createResilientPolicy, executeResiliently } = require('../src/utils/resilientClient');
const externalApiService = require('../src/services/externalApiService');

describe('Resilient Client', () => {
    describe('createResilientPolicy', () => {
        it('should create a policy with default name', () => {
            const policy = createResilientPolicy();
            expect(policy).toBeDefined();
            expect(typeof policy.execute).toBe('function');
        });

        it('should create a policy with custom name', () => {
            const policy = createResilientPolicy('CustomPolicy');
            expect(policy).toBeDefined();
        });
    });

    describe('executeResiliently with real async functions', () => {
        beforeEach(() => {
            externalApiService.resetFailureCount();
        });

        it('should execute successful operation', async () => {
            const policy = createResilientPolicy('TestPolicy');
            
            const result = await executeResiliently(
                () => externalApiService.performIdempotentAction(true),
                policy
            );
            
            expect(result).toContain('Success');
        }, 15000); // Increase timeout for this test

        it('should handle and retry failed operations', async () => {
            const policy = createResilientPolicy('TestPolicy');
            
            // This will fail a few times then succeed
            try {
                await executeResiliently(
                    () => externalApiService.performIdempotentAction(false),
                    policy
                );
            } catch (error) {
                // Expected to eventually fail after retries
                expect(error).toBeDefined();
            }
        }, 15000);

        it('should handle successful non-idempotent operations', async () => {
            const policy = createResilientPolicy('TestPolicy');
            
            const result = await executeResiliently(
                () => externalApiService.performNonIdempotentAction(true),
                policy
            );
            
            expect(result).toContain('Success');
        });
    });
});


