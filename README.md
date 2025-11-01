# Node.js Resilience Patterns Example

This project demonstrates the implementation of crucial resilience patterns in a Node.js application:

1.  **Retry Only on Idempotent Requests**
2.  **Circuit Breaker**
3.  **Exponential Backoff With Jitter**

These patterns help improve the stability and fault-tolerance of applications that interact with external services or microservices, especially in distributed systems.

## Table of Contents

*   [Concepts Explained](#concepts-explained)
*   [Project Structure](#project-structure)
*   [Installation](#installation)
*   [Usage](#usage)
*   [Code Explanation](#code-explanation)
    *   [`src/services/externalApiService.js`](#srcservicesexternalapiservicejs)
    *   [`src/utils/resilientExecutor.js`](#srcutilsresilientexecutorjs)
    *   [`src/app.js`](#srcappjs)
*   [Design Patterns & Best Practices](#design-patterns--best-practices)
*   [Future Enhancements](#future-enhancements)

## Installation

1.  Clone this repository:
    `git clone https://github.com/your-username/resilience-patterns-nodejs.git`
    `cd resilience-patterns-nodejs`
2.  Install dependencies:
    `npm install`

## Usage

To run the demonstration:

`node src/app.js`

Observe the console output to see the circuit breaker state changes, retry attempts with backoff and jitter, and the handling of idempotent vs. non-idempotent operations.

## Code Explanation

### `src/services/externalApiService.js`

This module remains the same. It simulates an external microservice or API, providing functions for both idempotent (`performIdempotentAction`) and non-idempotent (`performNonIdempotentAction`) operations with randomized failures and delays.

### `src/utils/resilientExecutor.js`

This module is updated to use `cockatiel`. It encapsulates the core resilience logic for Circuit Breaker and Retry with Exponential Backoff and Jitter.

*   **`createResilientClient`**:
    *   This function creates a `CircuitBreaker` instance from `cockatiel`.
    *   It configures the circuit breaker's behavior:
        *   `failureThreshold`: How many consecutive failures trigger an `open` state.
        *   `successThreshold`: How many consecutive successes in `half-open` state are needed to `close` the circuit.
        *   `resetTimeout`: How long the circuit stays `open` before transitioning to `half-open`.
        *   `timeout`: A timeout for the *individual protected operation* (if it takes too long, it's considered a failure).
    *   It sets up event listeners (`on('open')`, `on('half-open')`, `on('close')`) to log state changes.
    *   **Retry Integration**: `cockatiel`'s `CircuitBreaker` can itself be configured with retry options. We'll set a custom `retryPolicy` using the `exponentialBackoff` strategy with jitter.
        *   `exponentialBackoff`: This strategy automatically handles increasing delays.
        *   `randomize`: `cockatiel` can add jitter for us, simplifying the custom jitter logic we had before.
*   **`executeResiliently`**:
    *   This is the main function exposed by this utility.
    *   It takes the `async` operation function to be protected and calls `circuitBreaker.execute(operation)`.
    *   The `CircuitBreaker` instance, configured with its internal retry policy, handles both the circuit breaker logic and the retries automatically.

### `src/app.js`

This is the main entry point, updated to use the new `resilientExecutor` interface.

*   It creates a `resilientClient` using `createResilientClient`.
*   It then uses `executeResiliently` to protect the idempotent API calls across the demonstration phases.
*   The overall demonstration flow (non-idempotent handling, flaky service, down service, recovery) remains the same, providing consistent observation of the patterns.

## Design Patterns & Best Practices (Updated)

The core design patterns remain the same, but the implementation details for Circuit Breaker and Retry are now handled by `cockatiel`'s unified API, simplifying the `resilientExecutor` module.