// src/app.js

const externalApiService = require('./services/externalApiService');
const { createResilientPolicy, executeResiliently } = require('./utils/resilientClient');
const logger = require('./utils/logger').child('App');
const config = require('../config');

// Create a Resilient Policy (Retry + Circuit Breaker) for our idempotent API service
const idempotentApiResilientPolicy = createResilientPolicy('IdempotentApiService');

// Graceful shutdown handler
let isShuttingDown = false;

/**
 * Handle graceful shutdown on process termination signals
 * @param {string} signal - The signal received (SIGTERM, SIGINT, etc.)
 */
function handleShutdown(signal) {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    
    logger.info(`Received ${signal}. Gracefully shutting down...`);
    
    // Add any cleanup logic here (close connections, flush logs, etc.)
    setTimeout(() => {
        logger.info('Shutdown complete. Exiting.');
        process.exit(0);
    }, 1000);
}

// Register shutdown handlers
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

/**
 * Main application entry point
 * Demonstrates resilience patterns: retry, circuit breaker, exponential backoff with jitter
 */
async function main() {
    logger.info('======================================================================');
    logger.info(' Node.js Resilience Patterns Demo (using Cockatiel) ');
    logger.info(' (Retry Only on Idempotent, Circuit Breaker, Exponential Backoff + Jitter)');
    logger.info('======================================================================\n');

    // --- Phase 1: Demonstrate Non-Idempotent Request Handling ---
    logger.info('--- PHASE 1: NON-IDEMPOTENT OPERATION ---');
    logger.info(' (e.g., POST /orders - generally NOT suitable for automatic client-side retries)');
    try {
        await externalApiService.performNonIdempotentAction(false); // Simulate a failure
        logger.info('  Non-idempotent call succeeded (unexpected for demo).');
    } catch (error) {
        logger.error(`  Non-idempotent call failed: ${error.message}.`);
        logger.warn('  Action required: If this represents a critical operation, manual intervention or robust server-side idempotency handling (e.g., using an idempotency key) is typically required instead of client-side retries.');
    }
    logger.info('\n----------------------------------------------------------------------\n');


    // --- Phase 2: Idempotent Call - Flaky Service ---
    // Service fails a few times, then recovers. Circuit Breaker should open then close.
    logger.info('--- PHASE 2: IDEMPOTENT CALL - FLAKY SERVICE ---');
    logger.info(' (Service fails 3 times, then recovers. Observe retries and circuit opening/closing.)');
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 7; i++) {
        logger.info(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(i >= 3), // Fail first 3, then succeed
                idempotentApiResilientPolicy
            );
            logger.info('  Idempotent call group succeeded!');
        } catch (error) {
            logger.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config.app.demoDelayBetweenGroups));
    }
    logger.info('\n----------------------------------------------------------------------\n');


    // --- Phase 3: Idempotent Call - Service Down for Extended Period ---
    // Service consistently fails. Circuit Breaker should stay open and fast-fail requests.
    logger.info('--- PHASE 3: IDEMPOTENT CALL - SERVICE DOWN ---');
    logger.info(' (Service consistently fails. Observe circuit opening and fast-failing requests.)');
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 15; i++) {
        logger.info(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(false), // Always fail
                idempotentApiResilientPolicy
            );
            logger.info('  Idempotent call group succeeded! (Should not happen in this phase)');
        } catch (error) {
            logger.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config.app.demoDelayServiceDown));
    }
    logger.info('\n----------------------------------------------------------------------\n');


    // --- Phase 4: Idempotent Call - Service Recovery ---
    // Service was down, now it's starting to recover. Circuit Breaker should go half-open then close.
    logger.info('--- PHASE 4: IDEMPOTENT CALL - SERVICE RECOVERY ---');
    logger.info(' (Service starts to recover. Observe half-open state and circuit closing.)');
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 5; i++) {
        logger.info(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(i >= 2), // First 2 calls fail (half-open test), then succeed
                idempotentApiResilientPolicy
            );
            logger.info('  Idempotent call group succeeded!');
        } catch (error) {
            logger.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, config.app.demoDelayRecovery));
    }

    logger.info('======================================================================');
    logger.info(' Demo finished. Thank you for observing the resilience patterns.');
    logger.info('======================================================================');
}

main().catch(err => {
    logger.error('Unhandled error in main application', { error: err.message, stack: err.stack });
    process.exit(1);
});