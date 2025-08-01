import { describe, it, expect } from 'vitest'
import {
  type Instance,
  type InstanceData,
  type RuntimeVersions
} from './instance'

describe('Instance Types and Structure', () => {
  const sampleRuntimeVersions: RuntimeVersions = {
    minecraft: '1.19.2',
    forge: '43.2.0',
    fabricLoader: '0.14.21',
    quiltLoader: '',
    neoForged: '',
    optifine: '',
    liteloader: '',
    yarn: '',
    labyMod: ''
  }

  const sampleInstanceData: InstanceData = {
    name: 'Test Instance',
    author: 'Test Author',
    description: 'Test Description',
    version: 'forge-43.2.0-1.19.2',
    runtime: sampleRuntimeVersions,
    java: '/path/to/java',
    resolution: { width: 1920, height: 1080, fullscreen: false },
    minMemory: 2048,
    maxMemory: 8192,
    vmOptions: ['-Xmx8G'],
    mcOptions: ['--demo'],
    env: { TEST_VAR: 'test' },
    url: 'https://example.com',
    icon: 'icon.png',
    modpackVersion: '1.0.0',
    fileApi: 'https://api.example.com',
    server: { host: 'test.server.com', port: 25565 },
    tags: ['adventure', 'tech'],
    showLog: true,
    hideLauncher: false,
    fastLaunch: false,
    disableElybyAuthlib: false,
    disableAuthlibInjector: false,
    useLatest: false,
    playTime: 3600000,
    lastPlayedDate: Date.now(),
    upstream: {
      type: 'curseforge-modpack',
      modId: 123456,
      fileId: 789012
    },
    assignMemory: true,
    prependCommand: '',
    preExecuteCommand: ''
  }

  const sampleInstance: Instance = {
    ...sampleInstanceData,
    path: '/path/to/instance',
    lastAccessDate: Date.now(),
    creationDate: Date.now() - 86400000, // 1 day ago
    lastPlayedDate: Date.now() - 3600000, // 1 hour ago
    playtime: 3600000 // 1 hour
  }

  describe('RuntimeVersions Structure', () => {
    it('should have all required runtime version properties', () => {
      expect('minecraft' in sampleRuntimeVersions).toBe(true)
      expect('forge' in sampleRuntimeVersions).toBe(true)
      expect('fabricLoader' in sampleRuntimeVersions).toBe(true)
      expect('quiltLoader' in sampleRuntimeVersions).toBe(true)
      expect('neoForged' in sampleRuntimeVersions).toBe(true)
      expect('optifine' in sampleRuntimeVersions).toBe(true)
      expect('liteloader' in sampleRuntimeVersions).toBe(true)
      expect('yarn' in sampleRuntimeVersions).toBe(true)
      expect('labyMod' in sampleRuntimeVersions).toBe(true)
    })

    it('should have string values for all runtime properties', () => {
      Object.values(sampleRuntimeVersions).forEach(version => {
        expect(typeof version).toBe('string')
      })
    })

    it('should support empty strings for unused loaders', () => {
      expect(sampleRuntimeVersions.quiltLoader).toBe('')
      expect(sampleRuntimeVersions.neoForged).toBe('')
      expect(sampleRuntimeVersions.optifine).toBe('')
    })
  })

  describe('InstanceData Structure', () => {
    it('should have all required InstanceData properties', () => {
      expect(sampleInstanceData).toHaveProperty('name')
      expect(sampleInstanceData).toHaveProperty('runtime')
      expect(sampleInstanceData).toHaveProperty('java')
      expect(sampleInstanceData).toHaveProperty('version')
      expect(sampleInstanceData).toHaveProperty('server')
      expect(sampleInstanceData).toHaveProperty('tags')
      expect(sampleInstanceData).toHaveProperty('upstream')
      expect(sampleInstanceData).toHaveProperty('resolution')
      expect(sampleInstanceData).toHaveProperty('minMemory')
      expect(sampleInstanceData).toHaveProperty('maxMemory')
      expect(sampleInstanceData).toHaveProperty('vmOptions')
      expect(sampleInstanceData).toHaveProperty('mcOptions')
      expect(sampleInstanceData).toHaveProperty('env')
    })

    it('should have proper type for numeric properties', () => {
      expect(typeof sampleInstanceData.minMemory).toBe('number')
      expect(typeof sampleInstanceData.maxMemory).toBe('number')
      expect(typeof sampleInstanceData.playTime).toBe('number')
      expect(typeof sampleInstanceData.lastPlayedDate).toBe('number')
    })

    it('should have proper type for boolean properties', () => {
      expect(typeof sampleInstanceData.showLog).toBe('boolean')
      expect(typeof sampleInstanceData.hideLauncher).toBe('boolean')
      expect(typeof sampleInstanceData.fastLaunch).toBe('boolean')
      expect(typeof sampleInstanceData.disableElybyAuthlib).toBe('boolean')
      expect(typeof sampleInstanceData.disableAuthlibInjector).toBe('boolean')
      expect(typeof sampleInstanceData.useLatest).toBe('boolean')
      expect(typeof sampleInstanceData.assignMemory).toBe('boolean')
    })

    it('should have proper type for array properties', () => {
      expect(Array.isArray(sampleInstanceData.tags)).toBe(true)
      expect(Array.isArray(sampleInstanceData.vmOptions)).toBe(true)
      expect(Array.isArray(sampleInstanceData.mcOptions)).toBe(true)
    })

    it('should have proper type for object properties', () => {
      expect(typeof sampleInstanceData.resolution).toBe('object')
      expect(typeof sampleInstanceData.server).toBe('object')
      expect(typeof sampleInstanceData.runtime).toBe('object')
      expect(typeof sampleInstanceData.env).toBe('object')
      expect(typeof sampleInstanceData.upstream).toBe('object')
    })
  })

  describe('Instance Structure', () => {
    it('should extend InstanceData with additional properties', () => {
      // Should have all InstanceData properties
      expect(sampleInstance).toHaveProperty('name')
      expect(sampleInstance).toHaveProperty('runtime')
      expect(sampleInstance).toHaveProperty('java')

      // Should have additional Instance-specific properties
      expect(sampleInstance).toHaveProperty('path')
      expect(sampleInstance).toHaveProperty('lastAccessDate')
      expect(sampleInstance).toHaveProperty('creationDate')
      expect(sampleInstance).toHaveProperty('playtime')
    })

    it('should have valid path property', () => {
      expect(typeof sampleInstance.path).toBe('string')
      expect(sampleInstance.path.length).toBeGreaterThan(0)
    })

    it('should have valid timestamp properties', () => {
      expect(typeof sampleInstance.lastAccessDate).toBe('number')
      expect(typeof sampleInstance.creationDate).toBe('number')
      expect(typeof sampleInstance.playtime).toBe('number')
      
      expect(sampleInstance.lastAccessDate).toBeGreaterThan(0)
      expect(sampleInstance.creationDate).toBeGreaterThan(0)
      expect(sampleInstance.playtime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Resolution Configuration', () => {
    it('should have valid resolution structure', () => {
      const resolution = sampleInstanceData.resolution
      expect(resolution).toBeDefined()
      expect(resolution).toHaveProperty('width')
      expect(resolution).toHaveProperty('height')
      expect(resolution).toHaveProperty('fullscreen')
      
      if (resolution) {
        expect(typeof resolution.width).toBe('number')
        expect(typeof resolution.height).toBe('number')
        expect(typeof resolution.fullscreen).toBe('boolean')
      }
    })
  })

  describe('Server Configuration', () => {
    it('should have valid server structure when configured', () => {
      const server = sampleInstanceData.server
      expect(server).toBeDefined()
      expect(server).toHaveProperty('host')
      expect(server).toHaveProperty('port')
      
      if (server) {
        expect(typeof server.host).toBe('string')
        expect(typeof server.port).toBe('number')
        expect(server.host.length).toBeGreaterThan(0)
        expect(server.port).toBeGreaterThan(0)
      }
    })

    it('should handle null server configuration', () => {
      const instanceWithoutServer: InstanceData = {
        ...sampleInstanceData,
        server: null
      }
      
      expect(instanceWithoutServer.server).toBeNull()
    })
  })

  describe('Upstream Configuration', () => {
    it('should handle CurseForge upstream', () => {
      const upstream = sampleInstanceData.upstream
      expect(upstream).toBeDefined()
      
      if (upstream && upstream.type === 'curseforge-modpack') {
        expect(upstream.type).toBe('curseforge-modpack')
        expect(typeof upstream.modId).toBe('number')
        expect(typeof upstream.fileId).toBe('number')
      }
    })

    it('should handle undefined upstream', () => {
      const instanceWithoutUpstream: InstanceData = {
        ...sampleInstanceData,
        upstream: undefined
      }
      
      expect(instanceWithoutUpstream.upstream).toBeUndefined()
    })
  })
})
