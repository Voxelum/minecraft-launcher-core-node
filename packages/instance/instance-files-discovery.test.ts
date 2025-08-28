import { describe, it, expect } from 'vitest'
import { isSpecialFile } from './instance-files-discovery'

describe('Instance Discovery Utilities', () => {
  describe('isSpecialFile', () => {
    it('should identify log files as special', () => {
      expect(isSpecialFile('logs/latest.log')).toBe(true)
      expect(isSpecialFile('logs/debug.log')).toBe(true)
      expect(isSpecialFile('logs/2023-01-01-1.log.gz')).toBe(true)
    })

    it('should identify crash reports as special', () => {
      expect(isSpecialFile('crash-reports/crash-2023-01-01-server.txt')).toBe(true)
      expect(isSpecialFile('crash-reports/crash-2023-01-01.txt')).toBe(true)
    })

    it('should identify screenshots as special', () => {
      expect(isSpecialFile('screenshots/screenshot.png')).toBe(true)
      expect(isSpecialFile('screenshots/2023-01-01_12.30.45.png')).toBe(true)
    })

    it('should identify save files as special', () => {
      expect(isSpecialFile('saves/world1/level.dat')).toBe(true)
      expect(isSpecialFile('saves/New World/region/r.0.0.mca')).toBe(true)
    })

    it('should identify user configuration files as special', () => {
      expect(isSpecialFile('options.txt')).toBe(true)
      expect(isSpecialFile('servers.dat')).toBe(true)
      expect(isSpecialFile('hotbar.nbt')).toBe(true)
      expect(isSpecialFile('usercache.json')).toBe(true)
    })

    it('should NOT identify regular mod/resource files as special', () => {
      expect(isSpecialFile('mods/test-mod.jar')).toBe(false)
      expect(isSpecialFile('config/test.cfg')).toBe(false)
      expect(isSpecialFile('resourcepacks/pack.zip')).toBe(false)
      expect(isSpecialFile('shaderpacks/shader.zip')).toBe(false)
      expect(isSpecialFile('bin/natives/file.dll')).toBe(false)
    })

    it('should handle nested paths correctly', () => {
      expect(isSpecialFile('subdir/logs/latest.log')).toBe(false) // Not in root logs
      expect(isSpecialFile('saves/world1/logs/latest.log')).toBe(true) // Within saves
      expect(isSpecialFile('config/saves/backup.dat')).toBe(false) // Not actually saves
    })

    it('should handle empty and edge case paths', () => {
      expect(isSpecialFile('')).toBe(false)
      expect(isSpecialFile('/')).toBe(false)
      expect(isSpecialFile('logs')).toBe(false) // Directory, not file
      expect(isSpecialFile('logs/')).toBe(false) // Directory, not file
    })
  })
})
