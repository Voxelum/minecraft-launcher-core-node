const TestSequencer = require('@jest/test-sequencer').default;
const { sep } = require('path');

class CustomSequencer extends TestSequencer {
    sort(tests) {
        const index = tests.findIndex(t => t.path.indexOf(sep + 'installer') !== -1);
        const elem = tests.splice(index, 1)[0];
        tests.unshift(elem);
        return tests;
    }
}

module.exports = CustomSequencer;