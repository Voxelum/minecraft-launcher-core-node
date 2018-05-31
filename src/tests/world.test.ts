import { WorldInfo } from "..";
import * as assert from 'assert';
import * as fs from 'fs';

describe('WorldInfo', () => {
    it('should validate a simple map', async () => {
        const entry = await WorldInfo.findEntry('./tests/assets/sample-map');
        assert(entry, 'dir fail');
        assert.equal(entry, 'level.dat');
    })
    it('should validate a zip map', async () => {
        const entry = await WorldInfo.findEntry('./tests/assets/sample-map.zip');
        assert(entry, 'zip fail');
        assert.equal(entry, 'sample-map/level.dat');
    })
    it('should not validate a non-map directory', async () => {
        try {
            const entry = await WorldInfo.findEntry('./tests/assets/sample-resourcepack');
            throw new Error('Fail')
        } catch (e) { }
    })
    it('should not validate a non-map file', async () => {
        try {
            const entry = await WorldInfo.findEntry('./tests/assets/sample-resourcepack.zip');
            throw new Error('Fail')
        } catch (e) { }
    })
    it('should read a simpe map', () => {
        assert(WorldInfo.parse(fs.readFileSync('./tests/assets/sample-map/level.dat')));
    })
})
