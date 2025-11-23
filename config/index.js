// config/index.js

/**
 * Configuration loader
 * Merges default configuration with environment-specific overrides
 */

const defaultConfig = require('./default');

/**
 * Deep merge utility for configuration objects
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged configuration
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

/**
 * Load configuration based on NODE_ENV
 * @returns {Object} Configuration object
 */
function loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    let config = { ...defaultConfig };

    try {
        if (env === 'production') {
            const prodConfig = require('./production');
            config = deepMerge(defaultConfig, prodConfig);
        } else if (env === 'test') {
            const testConfig = require('./test');
            config = deepMerge(defaultConfig, testConfig);
        }
    } catch (error) {
        console.warn(`Could not load configuration for environment: ${env}. Using defaults.`);
    }

    return config;
}

module.exports = loadConfig();
