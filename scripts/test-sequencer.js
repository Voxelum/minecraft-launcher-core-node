const TestSequencer = require('@jest/test-sequencer').default;

class CustomSequencer extends TestSequencer {
    sort(tests) {
        return tests.sort((testA, testB) => {
            if (testA.path.indexOf('packages/installer') !== -1) {
                return -1;
            }
            if (testB.path.indexOf('packages/installer') !== -1) {
                return 1;
            }
            if (testA.path.indexOf('packages/forge-installer') !== -1
                && testB.path.indexOf('packages/liteloader') !== -1) {
                return -1;
            }
            if (testB.path.indexOf('packages/forge-installer') !== -1
                && testA.path.indexOf('packages/liteloader') !== -1) {
                return 1;
            }
            if (testA.path.indexOf('packages/launch') !== -1) {
                return 1;
            }
            if (testB.path.indexOf('packages/launch') !== -1) {
                return -1;
            }
            return testA.path.localeCompare(testB.path);
        });
    }
}

module.exports = CustomSequencer;