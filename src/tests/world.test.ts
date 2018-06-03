import { WorldInfo } from "..";
import * as assert from 'assert';
import * as fs from 'fs';

describe('WorldInfo', () => {
    it('should validate a simple map', async function () {
        const entry = await WorldInfo.findEntry(`${this.assets}/sample-map`);
        assert(entry, 'dir fail');
        assert.equal(entry, 'level.dat');
    })
    it('should validate a zip map', async function () {
        const entry = await WorldInfo.findEntry(`${this.assets}/sample-map.zip`);
        assert(entry, 'zip fail');
        assert.equal(entry, 'sample-map/level.dat');
    })
    it('should not validate a non-map directory', async function () {
        try {
            const entry = await WorldInfo.findEntry(`${this.assets}/sample-resourcepack`);
            throw new Error('Fail')
        } catch (e) { }
    })
    it('should not validate a non-map file', async function () {
        try {
            const entry = await WorldInfo.findEntry(`${this.assets}/sample-resourcepack.zip`);
            throw new Error('Fail')
        } catch (e) { }
    })
    it('should read a simpe map', function () {
        assert(WorldInfo.parse(fs.readFileSync(`${this.assets}/sample-map/level.dat`)));
    })
})
