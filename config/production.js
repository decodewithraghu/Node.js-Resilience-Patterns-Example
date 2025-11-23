// config/production.js

/**
 * Production configuration overrides
 * These values override defaults when NODE_ENV=production
 */

module.exports = {
    // Production API Endpoints
    apiEndpoints: {
        baseUrl: process.env.API_BASE_URL || 'https://api.production.example.com',
        users: process.env.API_USERS_URL || 'https://api.production.example.com/api/users',
        orders: process.env.API_ORDERS_URL || 'https://api.production.example.com/api/orders',
        products: process.env.API_PRODUCTS_URL || 'https://api.production.example.com/api/products',
    },

    // More aggressive retry in production
    retry: {
        maxAttempts: 5,
        initialDelay: 500,
        maxDelay: 60000,
    },

    // More conservative circuit breaker for production
    circuitBreaker: {
        failureThreshold: 5,
        successThreshold: 3,
        breakDuration: 30000,
    },

    // Production logging
    logging: {
        level: 'info',
        format: 'json',
        timestamp: true,
    }
};
