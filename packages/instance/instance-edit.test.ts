import { beforeEach, describe, expect, it } from 'vitest'
import { CreateInstanceOptions, InstanceSchema, createInstanceTemplate } from './instance'
import { EditInstanceOptions, applyInstanceChanges, assignShallow, computeInstanceEditChanges, createInstanceFromOptions, loadInstanceFromOptions } from './instance-edit'
import { VersionMetadataProvider } from './internal-type'

describe('Instance Assignment Utils', () => {
  let mockVersionProvider: VersionMetadataProvider

  beforeEach(() => {
    mockVersionProvider = {
      getLatestRelease: () => '1.19.2'
    }
  })

  describe('InstanceAssignmentUtils', () => {
    describe('assignShallow', () => {
      it('should assign properties and return true when changes are made', () => {
        const target = { name: 'old', author: 'author1', version: '1.0' }
        const source = { name: 'new', author: 'author1', description: 'desc' }

        const hasChanges = assignShallow(target, source)

        expect(hasChanges).toBe(true)
        expect(target.name).toBe('new')
        expect(target.author).toBe('author1') // unchanged
        expect((target as any).description).toBe('desc') // added
      })

      it('should return false when no changes are made', () => {
        const target = { name: 'same', author: 'same' }
        const source = { name: 'same', author: 'same' }

        const hasChanges = assignShallow(target, source)

        expect(hasChanges).toBe(false)
      })

      it('should skip undefined values', () => {
        const target = { name: 'old', author: 'author1' }
        const source = { name: 'new', author: undefined, description: 'desc' }

        const hasChanges = assignShallow(target, source)

        expect(hasChanges).toBe(true)
        expect(target.name).toBe('new')
        expect(target.author).toBe('author1') // unchanged due to undefined
        expect((target as any).description).toBe('desc')
      })
    })


    describe('loadInstanceFromOptions', () => {
      it('should load basic instance properties', () => {
        const options: InstanceSchema = {
          ...createInstanceTemplate(),
          name: 'Test Instance',
          author: 'Test Author',
          description: 'Test Description',
          runtime: { minecraft: '1.18.2' }
        }

        const instance = loadInstanceFromOptions(options, mockVersionProvider)

        expect(instance.name).toBe('Test Instance')
        expect(instance.author).toBe('Test Author')
        expect(instance.description).toBe('Test Description')
        expect(instance.runtime.minecraft).toBe('1.18.2')
      })

      it('should use version provider for default minecraft version', () => {
        const options: InstanceSchema = {
          ...createInstanceTemplate(),
          name: 'Test Instance',
          runtime: { minecraft: '' }
        }

        const instance = loadInstanceFromOptions(options, mockVersionProvider)

        expect(instance.runtime.minecraft).toBe('1.19.2')
      })

      it('should handle runtime assignment properly', () => {
        const options: InstanceSchema = {
          ...createInstanceTemplate(),
          name: 'Test Instance',
          runtime: {
            minecraft: '1.19.2',
            forge: '43.2.0',
            fabricLoader: '0.14.21'
          }
        }

        const instance = loadInstanceFromOptions(options, mockVersionProvider)

        expect(instance.runtime.minecraft).toBe('1.19.2')
        expect(instance.runtime.forge).toBe('43.2.0')
        expect(instance.runtime.fabricLoader).toBe('0.14.21')
        expect(instance.runtime.quiltLoader).toBeUndefined()
      })

      it('should handle resolution settings', () => {
        const options: InstanceSchema = {
          ...createInstanceTemplate(),
          name: 'Test Instance',
          resolution: { width: 1920, height: 1080, fullscreen: false }
        }

        const instance = loadInstanceFromOptions(options, mockVersionProvider)

        expect(instance.resolution).toEqual({ width: 1920, height: 1080, fullscreen: false })
      })

      it('should handle server configuration', () => {
        const options: InstanceSchema = {
          ...createInstanceTemplate(),
          name: 'Test Instance',
          server: { host: 'example.com', port: 25565 }
        }

        const instance = loadInstanceFromOptions(options, mockVersionProvider)

        expect(instance.server).toEqual({ host: 'example.com', port: 25565 })
      })
    })

    describe('createInstanceFromOptions', () => {
      it('should create instance from creation options', () => {
        const payload: CreateInstanceOptions = {
          name: 'New Instance',
          author: 'Creator',
          description: 'A new instance',
          runtime: { minecraft: '1.19.2', forge: '43.2.0' },
          icon: 'icon.png'
        }

        const instance = createInstanceFromOptions(payload, mockVersionProvider)

        expect(instance.name).toBe('New Instance')
        expect(instance.author).toBe('Creator')
        expect(instance.description).toBe('A new instance')
        expect(instance.icon).toBe('icon.png')
        expect(instance.runtime.minecraft).toBe('1.19.2')
        expect(instance.runtime.forge).toBe('43.2.0')
        expect(typeof instance.creationDate).toBe('number')
        expect(typeof instance.lastAccessDate).toBe('number')
      })

      it('should use version provider for minecraft version when not specified', () => {
        const payload: CreateInstanceOptions = {
          name: 'New Instance'
        }

        const instance = createInstanceFromOptions(payload, mockVersionProvider)

        expect(instance.runtime.minecraft).toBe('1.19.2')
      })

      it('should handle resolution in creation options', () => {
        const payload: CreateInstanceOptions = {
          name: 'New Instance',
          resolution: { width: 1024, height: 768, fullscreen: true }
        }

        const instance = createInstanceFromOptions(payload, mockVersionProvider)

        expect(instance.resolution).toEqual({ width: 1024, height: 768, fullscreen: true })
      })
    })
  })

  describe('computeInstanceEditChanges', () => {
    let currentInstance: InstanceSchema

    beforeEach(() => {
      currentInstance = {
        ...createInstanceTemplate(),
        name: 'Current Instance',
        author: 'Current Author',
        runtime: { minecraft: '1.19.2' },
        maxMemory: 4096,
        minMemory: 1024,
        assignMemory: false,
        showLog: false,
        resolution: { width: 1920, height: 1080, fullscreen: false },
        vmOptions: ['-Xmx4G'],
        mcOptions: ['--username', 'test'],
        server: { host: 'old.example.com', port: 25565 }
      }
    })

    it('should detect simple property changes', () => {
      const editOptions: EditInstanceOptions = {
        name: 'New Name',
        author: 'New Author',
        description: 'New Description'
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.name).toBe('New Name')
      expect(changes.author).toBe('New Author')
      expect(changes.description).toBe('New Description')
      expect(Object.keys(changes)).toHaveLength(3)
    })

    it('should not include unchanged properties', () => {
      const editOptions: EditInstanceOptions = {
        name: 'Current Instance', // same as current
        author: 'New Author'
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.name).toBeUndefined()
      expect(changes.author).toBe('New Author')
      expect(Object.keys(changes)).toHaveLength(1)
    })

    it('should handle memory options correctly', () => {
      const editOptions: EditInstanceOptions = {
        maxMemory: 8192,
        minMemory: undefined
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.maxMemory).toBe(8192)
      expect(changes.minMemory).toBeUndefined()
    })

    it('should handle negative memory values by setting to 0', () => {
      const editOptions: EditInstanceOptions = {
        maxMemory: -1000,
        minMemory: -500
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.maxMemory).toBe(0)
      expect(changes.minMemory).toBe(0)
    })

    it('should handle boolean properties', () => {
      const editOptions: EditInstanceOptions = {
        assignMemory: true,
        showLog: true,
        hideLauncher: false,
        fastLaunch: true
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.assignMemory).toBe(true)
      expect(changes.showLog).toBe(true)
      expect(changes.hideLauncher).toBe(false)
      expect(changes.fastLaunch).toBe(true)
    })

    it('should handle resolution changes', () => {
      const editOptions: EditInstanceOptions = {
        resolution: { width: 2560, height: 1440, fullscreen: true }
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.resolution).toEqual({ width: 2560, height: 1440, fullscreen: true })
    })

    it('should handle resolution being set to undefined', () => {
      const editOptions: EditInstanceOptions = {
        resolution: undefined
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.resolution).toBeUndefined()
    })

    it('should handle runtime changes', () => {
      const editOptions: EditInstanceOptions = {
        runtime: {
          minecraft: '1.20.1',
          forge: '47.1.0'
        }
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.runtime).toEqual({
        minecraft: '1.19.2', // preserved from current
        forge: '47.1.0' // new value
      })
    })

    it('should handle server changes', () => {
      const editOptions: EditInstanceOptions = {
        server: { host: 'new.example.com', port: 25566 }
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.server).toEqual({ host: 'new.example.com', port: 25566 })
    })

    it('should handle server being set to undefined', () => {
      const editOptions: EditInstanceOptions = {
        server: undefined
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.server).toBeUndefined()
    })

    it('should detect changes in array options', () => {
      const editOptions: EditInstanceOptions = {
        vmOptions: ['-Xmx8G', '-XX:+UseG1GC'],
        mcOptions: ['--username', 'newuser']
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.vmOptions).toEqual(['-Xmx8G', '-XX:+UseG1GC'])
      expect(changes.mcOptions).toEqual(['--username', 'newuser'])
    })

    it('should handle environment variables', () => {
      const editOptions: EditInstanceOptions = {
        env: { JAVA_HOME: '/usr/lib/jvm/java-17', CUSTOM_VAR: 'value' }
      }

      const changes = computeInstanceEditChanges(currentInstance, editOptions)

      expect(changes.env).toEqual({ JAVA_HOME: '/usr/lib/jvm/java-17', CUSTOM_VAR: 'value' })
    })
  })

  describe('applyInstanceChanges', () => {
    let instance: InstanceSchema

    beforeEach(() => {
      instance = {
        ...createInstanceTemplate(),
        name: 'Original Instance',
        author: 'Original Author',
        runtime: { minecraft: '1.19.2', forge: '43.2.0' },
        maxMemory: 4096
      }
    })

    it('should apply simple property changes', () => {
      const changes = {
        name: 'Updated Instance',
        author: 'Updated Author',
        maxMemory: 8192
      }

      const result = applyInstanceChanges(instance, changes)

      expect(result.name).toBe('Updated Instance')
      expect(result.author).toBe('Updated Author')
      expect(result.maxMemory).toBe(8192)
      expect(result.description).toBe(instance.description) // unchanged
    })

    it('should merge runtime changes properly', () => {
      const changes: Partial<InstanceSchema> = {
        runtime: { 
          ...instance.runtime,
          fabricLoader: '0.14.21', 
          quiltLoader: '0.19.2' 
        }
      }

      const result = applyInstanceChanges(instance, changes)

      expect(result.runtime.minecraft).toBe('1.19.2') // preserved
      expect(result.runtime.forge).toBe('43.2.0') // preserved
      expect(result.runtime.fabricLoader).toBe('0.14.21') // added
      expect(result.runtime.quiltLoader).toBe('0.19.2') // added
    })

    it('should not mutate the original instance', () => {
      const changes = { name: 'Updated Instance' }
      const originalName = instance.name

      const result = applyInstanceChanges(instance, changes)

      expect(instance.name).toBe(originalName)
      expect(result.name).toBe('Updated Instance')
      expect(result).not.toBe(instance)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete edit workflow', () => {
      const mockProvider: VersionMetadataProvider = {
        getLatestRelease: () => '1.19.2'
      }

      // Create initial instance
      const createOptions: CreateInstanceOptions = {
        name: 'Test Instance',
        author: 'Test Author',
        runtime: { minecraft: '1.19.2', forge: '43.2.0' }
      }

      const instance = createInstanceFromOptions(createOptions, mockProvider)

      // Compute edit changes
      const editOptions: EditInstanceOptions = {
        name: 'Updated Test Instance',
        runtime: { minecraft: '1.20.1', fabricLoader: '0.14.21' },
        maxMemory: 8192,
        showLog: true
      }

      const changes = computeInstanceEditChanges(instance, editOptions)

      // Apply changes
      const updatedInstance = applyInstanceChanges(instance, changes)

      expect(updatedInstance.name).toBe('Updated Test Instance')
      expect(updatedInstance.runtime.minecraft).toBe('1.19.2') // preserved from merge
      expect(updatedInstance.runtime.forge).toBe('43.2.0') // preserved
      expect(updatedInstance.runtime.fabricLoader).toBe('0.14.21') // added
      expect(updatedInstance.maxMemory).toBe(8192)
      expect(updatedInstance.showLog).toBe(true)
      expect(updatedInstance.author).toBe('Test Author') // unchanged
    })
  })
})
