import { describe, it, expect } from 'vitest'
import {
  DEFAULT_INSTANCE,
  InstanceUpstream,
  createInstanceTemplate,
  isUpstreamSameOrigin,
  type Instance,
  type InstanceData,
  type RuntimeVersions,
} from './instance'

describe('Instance Templates', () => {
  describe('createInstanceTemplate', () => {
    it('should create a default instance template', () => {
      const template = createInstanceTemplate()

      expect(template.name).toBe('')
      expect(template.path).toBe('')
      expect(template.runtime.minecraft).toBe('')
      expect(template.runtime.forge).toBe('')
      expect(template.runtime.fabricLoader).toBe('')
      expect(template.runtime.quiltLoader).toBe('')
      expect(template.runtime.neoForged).toBe('')
      expect(template.java).toBe('')
      expect(template.version).toBe('')
      expect(template.author).toBe('')
      expect(template.description).toBe('')
      expect(template.server).toBeNull()
      expect(template.tags).toEqual([])
      expect(template.lastAccessDate).toBe(-1)
      expect(template.creationDate).toBe(-1)
      expect(template.lastPlayedDate).toBe(0)
      expect(template.playtime).toBe(0)
    })

    it('should create templates with undefined optional properties', () => {
      const template = createInstanceTemplate()

      expect(template.resolution).toBeUndefined()
      expect(template.minMemory).toBeUndefined()
      expect(template.maxMemory).toBeUndefined()
      expect(template.vmOptions).toBeUndefined()
      expect(template.mcOptions).toBeUndefined()
      expect(template.env).toBeUndefined()
      expect(template.assignMemory).toBeUndefined()
      expect(template.prependCommand).toBeUndefined()
      expect(template.showLog).toBeUndefined()
      expect(template.hideLauncher).toBeUndefined()
      expect(template.disableAuthlibInjector).toBeUndefined()
      expect(template.disableElybyAuthlib).toBeUndefined()
      expect(template.fastLaunch).toBeUndefined()
      expect(template.upstream).toBeUndefined()
    })

    it('should create independent instances', () => {
      const template1 = createInstanceTemplate()
      const template2 = createInstanceTemplate()

      template1.name = 'Instance 1'
      template2.name = 'Instance 2'

      expect(template1.name).toBe('Instance 1')
      expect(template2.name).toBe('Instance 2')
      expect(template1.name).not.toBe(template2.name)
    })
  })

  describe('DEFAULT_INSTANCE', () => {
    it('should be frozen and immutable', () => {
      expect(Object.isFrozen(DEFAULT_INSTANCE)).toBe(true)

      // Attempts to modify should not work
      expect(() => {
        ;(DEFAULT_INSTANCE as any).name = 'Modified'
      }).toThrow()
    })

    it('should have the same structure as created template', () => {
      const template = createInstanceTemplate()

      expect(Object.keys(DEFAULT_INSTANCE)).toEqual(Object.keys(template))
      expect(DEFAULT_INSTANCE.name).toBe(template.name)
      expect(DEFAULT_INSTANCE.runtime.minecraft).toBe(template.runtime.minecraft)
    })
  })

  describe('isUpstreamSameOrigin', () => {
    it('should return false for different upstream types', () => {
      const curseforge: InstanceUpstream = {
        type: 'curseforge-modpack',
        modId: 123,
        fileId: 456,
      }
      const modrinth: InstanceUpstream = {
        type: 'modrinth-modpack',
        projectId: 'test-project',
        versionId: 'test-version',
      }

      expect(isUpstreamSameOrigin(curseforge, modrinth)).toBe(false)
    })

    it('should return true for same CurseForge modpacks', () => {
      const upstream1: InstanceUpstream = {
        type: 'curseforge-modpack',
        modId: 123,
        fileId: 456,
      }
      const upstream2: InstanceUpstream = {
        type: 'curseforge-modpack',
        modId: 123,
        fileId: 789, // Different file ID but same mod ID
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(true)
    })

    it('should return false for different CurseForge modpacks', () => {
      const upstream1: InstanceUpstream = {
        type: 'curseforge-modpack',
        modId: 123,
        fileId: 456,
      }
      const upstream2: InstanceUpstream = {
        type: 'curseforge-modpack',
        modId: 456, // Different mod ID
        fileId: 789,
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(false)
    })

    it('should return true for same Modrinth modpacks', () => {
      const upstream1: InstanceUpstream = {
        type: 'modrinth-modpack',
        projectId: 'test-project',
        versionId: 'v1.0.0',
      }
      const upstream2: InstanceUpstream = {
        type: 'modrinth-modpack',
        projectId: 'test-project',
        versionId: 'v2.0.0', // Different version but same project
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(true)
    })

    it('should return false for different Modrinth modpacks', () => {
      const upstream1: InstanceUpstream = {
        type: 'modrinth-modpack',
        projectId: 'project-1',
        versionId: 'v1.0.0',
      }
      const upstream2: InstanceUpstream = {
        type: 'modrinth-modpack',
        projectId: 'project-2', // Different project
        versionId: 'v1.0.0',
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(false)
    })

    it('should return true for same FTB modpacks', () => {
      const upstream1: InstanceUpstream = {
        type: 'ftb-modpack',
        id: 123,
        versionId: 1,
      }
      const upstream2: InstanceUpstream = {
        type: 'ftb-modpack',
        id: 123,
        versionId: 2, // Different version but same ID
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(true)
    })

    it('should handle peer upstream comparison', () => {
      const upstream1: InstanceUpstream = {
        type: 'peer',
        id: 'peer-123',
      }
      const upstream2: InstanceUpstream = {
        type: 'peer',
        id: 'peer-123',
      }
      const upstream3: InstanceUpstream = {
        type: 'peer',
        id: 'peer-456',
      }

      expect(isUpstreamSameOrigin(upstream1, upstream2)).toBe(true)
      expect(isUpstreamSameOrigin(upstream1, upstream3)).toBe(false)
    })
  })
})
