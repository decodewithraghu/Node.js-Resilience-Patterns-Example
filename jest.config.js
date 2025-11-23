// jest.config.js

module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        'config/**/*.js',
        '!src/app.js', // Exclude main entry point from coverage
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: [
        '**/tests/**/*.test.js'
    ],
    verbose: true,
    testTimeout: 30000, // Increase timeout to 30 seconds for resilience pattern tests
};
