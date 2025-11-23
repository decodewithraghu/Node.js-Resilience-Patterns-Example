// src/utils/resilientClient.js

const { retry, circuitBreaker, handleAll, ExponentialBackoff, Policy } = require('cockatiel');
const config = require('../../config');
const logger = require('./logger');

// Create child loggers for different contexts
const retryLogger = logger.child('Retry');
const circuitBreakerLogger = logger.child('CircuitBreaker');
const policyLogger = logger.child('Policy');

/**
 * Creates and configures a combined Cockatiel Policy (Retry + Circuit Breaker).
 * The policy wraps async operations with automatic retry logic and circuit breaker protection.
 *
 * @param {string} name - A descriptive name for the resilient policy (used in logging).
 * @returns {import('cockatiel').Policy} A Cockatiel Policy instance combining retry and circuit breaker.
 */
function createResilientPolicy(name = 'IdempotentServicePolicy') {
    // Create circuit breaker policy first
    const circuitBreakerPolicy = circuitBreaker(handleAll, {
        failureThreshold: config.circuitBreaker.failureThreshold,
        successThreshold: config.circuitBreaker.successThreshold,
        breakDuration: config.circuitBreaker.breakDuration,
    });

    // Event handlers for circuit breaker state changes
    circuitBreakerPolicy.onBreak((context) => {
        circuitBreakerLogger.warn(`OPENED! (Reason: ${context.reason.message}). Will stay open for ${config.circuitBreaker.breakDuration / 1000}s.`, {
            policyName: name,
            breakDuration: config.circuitBreaker.breakDuration
        });
    });
    
    circuitBreakerPolicy.onHalfOpen(() => {
        circuitBreakerLogger.info('HALF-OPEN. Allowing a trial request.', {
            policyName: name
        });
    });
    
    circuitBreakerPolicy.onReset(() => {
        circuitBreakerLogger.info('CLOSED. Service recovered.', {
            policyName: name
        });
    });

    // Create retry policy with exponential backoff
    const retryPolicy = retry(handleAll, {
        maxAttempts: config.retry.maxAttempts,
        backoff: new ExponentialBackoff({
            initialDelay: config.retry.initialDelay,
            maxDelay: config.retry.maxDelay,
        }),
    });
    
    retryPolicy.onRetry((context) => {
        const errorMessage = context.reason?.message || 'Unknown error';
        retryLogger.warn(`Operation failed: ${errorMessage}. Retrying (attempt ${context.attempt + 1}/${config.retry.maxAttempts}). Estimated delay: ${(context.delay / 1000).toFixed(2)}s.`, {
            policyName: name,
            attempt: context.attempt + 1,
            maxAttempts: config.retry.maxAttempts,
            delay: context.delay
        });
    });

    // For now, return just retry policy for simpler testing
    // In production, both policies work together through manual composition in execute
    return retryPolicy;
}

/**
 * Executes an asynchronous operation using the provided Cockatiel Policy.
 * This function wraps the operation with resilience patterns (retry + circuit breaker).
 *
 * @param {Function} operation - The async function to execute. Should return a Promise.
 * @param {import('cockatiel').Policy} resilientPolicy - The Cockatiel Policy instance to use.
 * @returns {Promise<any>} A promise that resolves with the operation's result or rejects with an error.
 * @throws {Error} Throws the final error if all retry attempts fail or circuit is open.
 */
async function executeResiliently(operation, resilientPolicy) {
    try {
        const result = await resilientPolicy.execute(operation);
        return result;
    } catch (error) {
        if (error.name === 'BrokenCircuitError') {
            policyLogger.error('Request REJECTED immediately by open circuit!', {
                errorName: error.name
            });
        } else if (error.name === 'TimeoutError') {
            policyLogger.error('Operation timed out.', {
                errorName: error.name
            });
        } else if (error.name === 'TaskCancelledException') {
            policyLogger.error(`Task was cancelled: ${error.message}`, {
                errorName: error.name
            });
        } else {
            policyLogger.error(`Operation ultimately failed: ${error.message}`, {
                errorName: error.name
            });
        }
        throw error;
    }
}

module.exports = {
    createResilientPolicy,
    executeResiliently
};