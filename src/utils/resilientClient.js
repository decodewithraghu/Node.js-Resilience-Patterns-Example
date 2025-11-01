// src/utils/resilientClient.js

// 1. IMPORT the top-level `wrap` function explicitly. This is the key fix.
const { retry, circuitBreaker, handleAll, ExponentialBackoff, wrap } = require('cockatiel');

// --- Retry Policy Configuration ---
const RETRY_POLICY_OPTIONS = {
    maxAttempts: 6,
    initialDelay: 1000,
    maxDelay: 30000
};

// --- Circuit Breaker Policy Configuration ---
const CIRCUIT_BREAKER_POLICY_OPTIONS = {
    failureThreshold: 3,
    successThreshold: 2,
    breakDuration: 10000,
};

/**
 * Creates and configures a combined Cockatiel Policy (Retry + Circuit Breaker).
 *
 * @param {string} name - A descriptive name for the resilient policy.
 * @returns {import('cockatiel').Policy} A Cockatiel Policy instance.
 */
function createResilientPolicy(name = 'IdempotentServicePolicy') {
    // This part is correct: create the individual policies using builders.
    const retryPolicy = retry(handleAll, {
        maxAttempts: RETRY_POLICY_OPTIONS.maxAttempts,
        backoff: new ExponentialBackoff({
            initialDelay: RETRY_POLICY_OPTIONS.initialDelay,
            maxDelay: RETRY_POLICY_OPTIONS.maxDelay,
        }),
    }).onRetry((context) => {
        console.log(`    [Retry: ${name}] Operation failed: ${context.reason.message}. Retrying (attempt ${context.attempt + 1}/${RETRY_POLICY_OPTIONS.maxAttempts}). Estimated delay: ${(context.delay / 1000).toFixed(2)}s.`);
    });

    const circuitBreakerPolicy = circuitBreaker(handleAll, {
        failureThreshold: CIRCUIT_BREAKER_POLICY_OPTIONS.failureThreshold,
        successThreshold: CIRCUIT_BREAKER_POLICY_OPTIONS.successThreshold,
        breakDuration: CIRCUIT_BREAKER_POLICY_OPTIONS.breakDuration,
    });

    circuitBreakerPolicy.onBreak((context) => {
        console.warn(`[Circuit Breaker: ${name}] OPENED! (Reason: ${context.reason.message}). Will stay open for ${CIRCUIT_BREAKER_POLICY_OPTIONS.breakDuration / 1000}s.`);
    });
    circuitBreakerPolicy.onHalfOpen(() => {
        console.log(`[Circuit Breaker: ${name}] HALF-OPEN. Allowing a trial request.`);
    });
    circuitBreakerPolicy.onReset(() => {
        console.log(`[Circuit Breaker: ${name}] CLOSED. Service recovered.`);
    });

    // 2. USE the imported `wrap` function to combine the policies.
    // The order is outer-to-inner. The request goes through `retryPolicy` first.
    return wrap(retryPolicy, circuitBreakerPolicy);
}

/**
 * Executes an asynchronous operation using the provided Cockatiel Policy.
 *
 * @param {Function} operation - The async function to execute.
 * @param {import('cockatiel').Policy} resilientPolicy - The Cockatiel Policy instance.
 * @returns {Promise<any>} A promise that resolves with the operation's result.
 */
async function executeResiliently(operation, resilientPolicy) {
    try {
        const result = await resilientPolicy.execute(operation);
        return result;
    } catch (error) {
        if (error.name === 'CircuitBrokenError') {
            console.error(`  [Cockatiel] Request REJECTED immediately by open circuit!`);
        } else if (error.name === 'TimeoutError') {
             console.error(`  [Cockatiel] Operation timed out.`);
        } else if (error.name === 'TaskCancelledException') {
            console.error(`  [Cockatiel] Task was cancelled: ${error.message}`);
        }
        else {
            console.error(`  [Cockatiel] Operation ultimately failed: ${error.message}`);
        }
        throw error;
    }
}

module.exports = {
    createResilientPolicy,
    executeResiliently
};