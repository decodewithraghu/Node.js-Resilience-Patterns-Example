// src/app.js

const externalApiService = require('./services/externalApiService');
const { createResilientPolicy, executeResiliently } = require('./utils/resilientClient');

// Create a Resilient Policy (Retry + Circuit Breaker) for our idempotent API service
const idempotentApiResilientPolicy = createResilientPolicy('IdempotentApiService');

async function main() {
    console.log("======================================================================");
    console.log(" Node.js Resilience Patterns Demo (using Cockatiel) ");
    console.log(" (Retry Only on Idempotent, Circuit Breaker, Exponential Backoff + Jitter)");
    console.log("======================================================================\n");

    // --- Phase 1: Demonstrate Non-Idempotent Request Handling ---
    console.log("--- PHASE 1: NON-IDEMPOTENT OPERATION ---");
    console.log(" (e.g., POST /orders - generally NOT suitable for automatic client-side retries)");
    try {
        await externalApiService.performNonIdempotentAction(false); // Simulate a failure
        console.log("  Non-idempotent call succeeded (unexpected for demo).");
    } catch (error) {
        console.error(`  Non-idempotent call failed: ${error.message}.`);
        console.warn("  Action required: If this represents a critical operation, manual intervention or robust server-side idempotency handling (e.g., using an idempotency key) is typically required instead of client-side retries.");
    }
    console.log("\n----------------------------------------------------------------------\n");


    // --- Phase 2: Idempotent Call - Flaky Service ---
    // Service fails a few times, then recovers. Circuit Breaker should open then close.
    console.log("--- PHASE 2: IDEMPOTENT CALL - FLAKY SERVICE ---");
    console.log(" (Service fails 3 times, then recovers. Observe retries and circuit opening/closing.)");
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 7; i++) {
        console.log(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(i >= 3), // Fail first 3, then succeed
                idempotentApiResilientPolicy
            );
            console.log("  Idempotent call group succeeded!");
        } catch (error) {
            console.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 300)); // Small delay between call groups
    }
    console.log("\n----------------------------------------------------------------------\n");


    // --- Phase 3: Idempotent Call - Service Down for Extended Period ---
    // Service consistently fails. Circuit Breaker should stay open and fast-fail requests.
    console.log("--- PHASE 3: IDEMPOTENT CALL - SERVICE DOWN ---");
    console.log(" (Service consistently fails. Observe circuit opening and fast-failing requests.)");
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 15; i++) {
        console.log(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(false), // Always fail
                idempotentApiResilientPolicy
            );
            console.log("  Idempotent call group succeeded! (Should not happen in this phase)");
        } catch (error) {
            console.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay to allow circuit breaker resetTimeout to pass
    }
    console.log("\n----------------------------------------------------------------------\n");


    // --- Phase 4: Idempotent Call - Service Recovery ---
    // Service was down, now it's starting to recover. Circuit Breaker should go half-open then close.
    console.log("--- PHASE 4: IDEMPOTENT CALL - SERVICE RECOVERY ---");
    console.log(" (Service starts to recover. Observe half-open state and circuit closing.)");
    externalApiService.resetFailureCount(); // Reset for this phase

    for (let i = 0; i < 5; i++) {
        console.log(`\n--- Call Group ${i + 1} ---`);
        try {
            await executeResiliently(
                () => externalApiService.performIdempotentAction(i >= 2), // First 2 calls fail (half-open test), then succeed
                idempotentApiResilientPolicy
            );
            console.log("  Idempotent call group succeeded!");
        } catch (error) {
            console.error(`  Idempotent call group ultimately failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay
    }

    console.log("\n======================================================================");
    console.log(" Demo finished. Thank you for observing the resilience patterns.");
    console.log("======================================================================");
}

main().catch(err => {
    console.error("\nUnhandled error in main application:", err);
    process.exit(1);
});