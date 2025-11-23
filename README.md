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
*   [Configuration](#configuration)
*   [Usage](#usage)
*   [Code Explanation](#code-explanation)
    *   [`src/services/externalApiService.js`](#srcservicesexternalapiservicejs)
    *   [`src/utils/resilientClient.js`](#srcutilsresilientclientjs)
    *   [`src/app.js`](#srcappjs)
    *   [`config/`](#config)
    *   [`src/utils/logger.js`](#srcutilsloggerjs)
*   [Running Tests](#running-tests)
*   [Design Patterns & Best Practices](#design-patterns--best-practices)
*   [Future Enhancements](#future-enhancements)

## Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/your-username/resilience-patterns-nodejs.git
    cd resilience-patterns-nodejs
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure environment variables (optional):
    ```bash
    cp .env.example .env
    # Edit .env to configure your API endpoints
    ```

## Configuration

### Environment Variables

The application supports configuration via environment variables. Copy `.env.example` to `.env` and customize:

```bash
# API Base URL
API_BASE_URL=http://localhost:3000

# Individual API Endpoints (optional - will use baseUrl + path if not specified)
API_USERS_URL=http://localhost:3000/api/users
API_ORDERS_URL=http://localhost:3000/api/orders
API_PRODUCTS_URL=http://localhost:3000/api/products

# Application Environment
NODE_ENV=development  # or 'production'
```

### Configuration Files

Configuration is managed through the `config/` directory:

- **`config/default.js`** - Default configuration for development
  - Retry settings (max attempts, delays)
  - Circuit breaker thresholds
  - API endpoint URLs with environment variable support
  - Logging configuration (debug level, pretty format)
  - Simulation parameters

- **`config/production.js`** - Production overrides
  - More conservative retry and circuit breaker settings
  - Production API endpoints
  - JSON logging format

- **`config/index.js`** - Configuration loader that merges environment-specific configs

### API Endpoints Configuration

Configure external API endpoints in `config/default.js`:

```javascript
apiEndpoints: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
    users: process.env.API_USERS_URL || 'http://localhost:3000/api/users',
    orders: process.env.API_ORDERS_URL || 'http://localhost:3000/api/orders',
    products: process.env.API_PRODUCTS_URL || 'http://localhost:3000/api/products',
}
```

Access in your code:
```javascript
const config = require('../config');
console.log(config.apiEndpoints.users);
```

## Usage

### Running the Demo

```bash
# Run in development mode
npm start

# Run in production mode
npm run start:prod
```

The application will demonstrate:
- Non-idempotent operation handling (no retries)
- Flaky service with automatic retries
- Service down scenario with circuit breaker protection
- Service recovery with half-open state

Observe the console output to see the circuit breaker state changes, retry attempts with backoff and jitter, and the handling of idempotent vs. non-idempotent operations.

## Code Explanation

### `src/services/externalApiService.js`

This module simulates an external microservice or API, providing functions for both idempotent (`performIdempotentAction`) and non-idempotent (`performNonIdempotentAction`) operations with randomized failures and delays. Configuration values are externalized to the `config/` directory.

### `src/utils/resilientClient.js`

This module uses `cockatiel` to encapsulate the core resilience logic for Circuit Breaker and Retry with Exponential Backoff and Jitter.

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

This is the main entry point, demonstrating the resilience patterns in action.

*   It creates a `resilientClient` using `createResilientPolicy`.
*   It then uses `executeResiliently` to protect the idempotent API calls across the demonstration phases.
*   The overall demonstration flow (non-idempotent handling, flaky service, down service, recovery) provides consistent observation of the patterns.
*   Includes graceful shutdown handlers for SIGTERM and SIGINT signals.

### `config/`

Configuration directory containing:
*   `default.js` - Default configuration for development
*   `production.js` - Production overrides
*   `index.js` - Configuration loader with environment-based merging

### `src/utils/logger.js`

Winston-based logging utility with structured logging support and contextual child loggers.

## Running Tests

This project includes a comprehensive test suite using Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Design Patterns & Best Practices (Updated)

The core design patterns remain the same, but the implementation details for Circuit Breaker and Retry are now handled by `cockatiel`'s unified API, simplifying the `resilientExecutor` module.