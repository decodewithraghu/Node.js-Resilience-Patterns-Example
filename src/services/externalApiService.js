// src/services/externalApiService.js

let _failureCount = 0;
const _random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Simulates a call to an external API endpoint that performs an IDEMPOTENT action.
 * e.g., PUT /products/{id}, DELETE /orders/{id}
 *
 * @param {boolean} isSuccessExpected - Controls the baseline success/failure for demo phases.
 * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
 */
async function performIdempotentAction(isSuccessExpected) {
    console.log("      [API Call] Attempting Idempotent API call...");
    await new Promise(resolve => setTimeout(resolve, _random(50, 200))); // Simulate network latency

    if (isSuccessExpected) {
        // Introduce a small chance of transient failure even when success is expected
        if (_random(0, 100) < 5) { // 5% chance of transient failure
            _failureCount++;
            throw new Error(`Idempotent API call failed transiently (Simulated Failure ${_failureCount})`);
        }
        return `Success: Idempotent API call completed.`;
    } else {
        _failureCount++;
        // Fail consistently for first few calls, then become flaky
        if (_failureCount <= 3) {
            throw new Error(`Idempotent API call failed (Simulated Failure ${_failureCount})`);
        } else if (_failureCount > 3 && _random(0, 100) < 70) { // 70% chance of failure after initial consecutive failures
            throw new Error(`Idempotent API call failed (Simulated Failure ${_failureCount})`);
        } else {
            console.log("      [API Call] Idempotent API call unexpectedly succeeded (simulated partial recovery).");
            return `Success: Idempotent API call (partial recovery).`;
        }
    }
}

/**
 * Simulates a call to an external API endpoint that performs a NON-IDEMPOTENT action.
 * e.g., POST /orders, PATCH /accounts/{id}/incrementBalance
 *
 * @param {boolean} isSuccessExpected - Controls the baseline success/failure for demo.
 * @returns {Promise<string>} A promise that resolves with a success message or rejects with an error.
 */
async function performNonIdempotentAction(isSuccessExpected) {
    console.log("      [API Call] Attempting Non-Idempotent API call...");
    await new Promise(resolve => setTimeout(resolve, _random(50, 200))); // Simulate network latency

    if (isSuccessExpected) {
        return `Success: Non-Idempotent API call completed.`;
    } else {
        throw new Error("Non-Idempotent API call failed (e.g., 'order already exists but with different details' or 'internal server error after creation').");
    }
}

/**
 * Resets the internal failure count for demonstration purposes.
 */
function resetFailureCount() {
    _failureCount = 0;
}

module.exports = {
    performIdempotentAction,
    performNonIdempotentAction,
    resetFailureCount
};