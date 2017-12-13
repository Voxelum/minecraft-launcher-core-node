import { Forge } from '../index'
import * as fs from 'fs-extra'
import * as assert from 'assert';

describe('ForgeConfig', () => {
    const cfg1 = `
    # Configuration file
    
    tweaks {
        # Replace the FML test config GUI with a working GUI.
        B:replaceInGameConfig=true
    }
    
    
    versioncheck {
        # Should the mod check for updates?
        B:checkForUpdates=true
    
        # A list of known updates. Deleting versions from the list will remind you about them again.
        S:knownVersions <
            InGameInfoXML 2.8.1.82
            LunatriusCore 1.1.2.21
         >
    
        # Should the mod remind you only for new updates (once per version)?
        B:silenceKnownUpdates=false
    }
    
    `;
    let config: Forge.Config;
    it('forge config parsing', () => {
        config = Forge.Config.parse(cfg1);
    })
    it('forge config categories parsing', () => {
        assert(config['versioncheck'])
        assert(config['tweaks'])
    })
    it('forge config property parsing', () => {
        assert.equal(config['tweaks'].properties[0].name, 'replaceInGameConfig')
        assert.equal(config['tweaks'].properties[0].comment, 'Replace the FML test config GUI with a working GUI.')
        assert.equal(config['tweaks'].properties[0].type, 'B')
    })
    it('forge config multiple properties parsing', () => {
        assert.equal(config['versioncheck'].properties[0].name, 'checkForUpdates')
        assert.equal(config['versioncheck'].properties[1].name, 'knownVersions')
        assert.equal(config['versioncheck'].properties[2].name, 'silenceKnownUpdates')
        assert.equal(config['versioncheck'].properties[0].type, 'B')
        assert.equal(config['versioncheck'].properties[1].type, 'S')
        assert.equal(config['versioncheck'].properties[2].type, 'B')
    })
})