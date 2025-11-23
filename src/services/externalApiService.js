// src/services/externalApiService.js

const config = require('../../config');
const logger = require('../utils/logger').child('ExternalAPI');

// Service state
let _failureCount = 0;

// Configuration constants
const MIN_LATENCY = config.externalApi.minLatency;
const MAX_LATENCY = config.externalApi.maxLatency;
const TRANSIENT_FAILURE_RATE = config.externalApi.transientFailureRate;
const FLAKY_FAILURE_RATE = config.externalApi.flakyFailureRate;
const CONSECUTIVE_FAILURE_THRESHOLD = config.externalApi.consecutiveFailureThreshold;

// Utility functions
const _random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Simulates a call to an external API endpoint that performs an IDEMPOTENT action.
 * Idempotent operations can be safely retried as they produce the same result when called multiple times.
 * Examples: GET /products/{id}, PUT /products/{id}, DELETE /orders/{id}
 *
 * @param {boolean} isSuccessExpected - Controls the baseline success/failure for demo phases.
 * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
 * @throws {Error} When the API call fails (simulated)
 */
async function performIdempotentAction(isSuccessExpected) {
    logger.debug('Attempting Idempotent API call...');
    await new Promise(resolve => setTimeout(resolve, _random(MIN_LATENCY, MAX_LATENCY))); // Simulate network latency

    if (isSuccessExpected) {
        // Introduce a small chance of transient failure even when success is expected
        if (_random(0, 100) < TRANSIENT_FAILURE_RATE) {
            _failureCount++;
            throw new Error(`Idempotent API call failed transiently (Simulated Failure ${_failureCount})`);
        }
        return `Success: Idempotent API call completed.`;
    } else {
        _failureCount++;
        // Fail consistently for first few calls, then become flaky
        if (_failureCount <= CONSECUTIVE_FAILURE_THRESHOLD) {
            throw new Error(`Idempotent API call failed (Simulated Failure ${_failureCount})`);
        } else if (_failureCount > CONSECUTIVE_FAILURE_THRESHOLD && _random(0, 100) < FLAKY_FAILURE_RATE) {
            throw new Error(`Idempotent API call failed (Simulated Failure ${_failureCount})`);
        } else {
            logger.debug('Idempotent API call unexpectedly succeeded (simulated partial recovery).');
            return `Success: Idempotent API call (partial recovery).`;
        }
    }
}

/**
 * Simulates a call to an external API endpoint that performs a NON-IDEMPOTENT action.
 * Non-idempotent operations should NOT be automatically retried as they may produce different
 * results or side effects when called multiple times.
 * Examples: POST /orders, PATCH /accounts/{id}/incrementBalance
 *
 * @param {boolean} isSuccessExpected - Controls the baseline success/failure for demo.
 * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
 * @throws {Error} When the API call fails (simulated)
 */
async function performNonIdempotentAction(isSuccessExpected) {
    logger.debug('Attempting Non-Idempotent API call...');
    await new Promise(resolve => setTimeout(resolve, _random(MIN_LATENCY, MAX_LATENCY))); // Simulate network latency

    if (isSuccessExpected) {
        return `Success: Non-Idempotent API call completed.`;
    } else {
        throw new Error("Non-Idempotent API call failed (e.g., 'order already exists but with different details' or 'internal server error after creation').");
    }
}

/**
 * Resets the internal failure count for demonstration purposes.
 * This allows different test phases to start with a clean state.
 * 
 * @returns {void}
 */
function resetFailureCount() {
    _failureCount = 0;
}

module.exports = {
    performIdempotentAction,
    performNonIdempotentAction,
    resetFailureCount
};