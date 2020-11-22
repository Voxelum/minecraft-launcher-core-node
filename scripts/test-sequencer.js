const TestSequencer = require('@jest/test-sequencer').default;
const { sep } = require('path');

class CustomSequencer extends TestSequencer {
    sort(tests) {
        const installerTests = tests.filter(t => t.path.indexOf(sep + 'installer') !== -1);
        const nonInstallerTests = tests.filter(t => t.path.indexOf(sep + 'installer') === -1);
        return installerTests.concat(nonInstallerTests);
    }
}

module.exports = CustomSequencer;