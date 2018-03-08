import { Forge } from "../src/forge";
import * as assert from 'assert'
import { MinecraftFolder, Launcher } from "../index";
import * as fs from 'fs'

describe('Forge', () => {
    it('should fetch the forge remote json list', async () => {
        const listContainer = await Forge.VersionMetaList.update();
        const list = listContainer.list;
        assert(list);
        const meta = Forge.VersionMetaList.metaByRecommended(list, 'recommended');
        assert(meta);
    }).timeout(100000)
    it('should not fetch duplicate forge version', async () => {
        const listContainer0 = await Forge.VersionMetaList.update();
        const listContainer1 = await Forge.VersionMetaList.update({ fallback: listContainer0 });
        assert.equal(listContainer0, listContainer1);
    }).timeout(100000)

    describe('Config', () => {
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
})