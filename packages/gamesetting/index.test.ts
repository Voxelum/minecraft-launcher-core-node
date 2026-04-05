import * as GameSetting from './index'
import { decodeUnicodeEscapes, encodeUnicodeEscapes } from './index'
import { describe, test, expect } from 'vitest'

describe('GameSetting', () => {
  test('should parse all options', () => {
    const s = `
version:512
invertYMouse:false
mouseSensitivity:0.47887325
fov:0.0
gamma:1.0
saturation:0.0
renderDistance:12
guiScale:0
particles:1
bobView:true
anaglyph3d:false
maxFps:120
fboEnable:true
difficulty:1
fancyGraphics:false
ao:1
renderClouds:false
resourcePacks:["Xray Ultimate 1.12 v2.2.1.zip","fabric:abc"]
incompatibleResourcePacks:[]
lastServer:play.mcndsj.com
lang:en_US
chatVisibility:0
chatColors:true
chatLinks:true
chatLinksPrompt:true
chatOpacity:1.0
snooperEnabled:true
fullscreen:false
enableVsync:true
useVbo:true
hideServerAddress:false
advancedItemTooltips:false
pauseOnLostFocus:true
touchscreen:false
overrideWidth:0
overrideHeight:0
heldItemTooltips:true
chatHeightFocused:1.0
chatHeightUnfocused:0.44366196
chatScale:1.0
chatWidth:1.0
showInventoryAchievementHint:false
mipmapLevels:4
forceUnicodeFont:false
reducedDebugInfo:false
useNativeTransport:true
entityShadows:true
mainHand:right
attackIndicator:1
showSubtitles:false
realmsNotifications:true
enableWeakAttacks:false
autoJump:true
key_key.attack:-100
key_key.use:-99
key_key.forward:17
key_key.left:30
key_key.back:31
key_key.right:32
key_key.jump:57
key_key.sneak:42
key_key.sprint:29
key_key.drop:16
key_key.inventory:18
key_key.chat:28
key_key.playerlist:15
key_key.pickItem:-98
key_key.command:53
key_key.screenshot:60
key_key.togglePerspective:63
key_key.smoothCamera:0
key_key.fullscreen:87
key_key.spectatorOutlines:0
key_key.swapHands:33
key_key.hotbar.1:2
key_key.hotbar.2:3
key_key.hotbar.3:4
key_key.hotbar.4:5
key_key.hotbar.5:6
key_key.hotbar.6:7
key_key.hotbar.7:8
key_key.hotbar.8:9
key_key.hotbar.9:10
soundCategory_master:1.0
soundCategory_music:1.0
soundCategory_record:1.0
soundCategory_weather:1.0
soundCategory_block:1.0
soundCategory_hostile:1.0
soundCategory_neutral:1.0
soundCategory_player:1.0
soundCategory_ambient:1.0
soundCategory_voice:1.0
modelPart_cape:true
modelPart_jacket:true
modelPart_left_sleeve:true
modelPart_right_sleeve:true
modelPart_left_pants_leg:true
modelPart_right_pants_leg:true
modelPart_hat:true
`
    const set = GameSetting.parse(s)
    expect(set).toBeTruthy()
    expect(set.ao).toEqual(GameSetting.AmbientOcclusion.Minimum)
    expect(set.fov).toEqual(0)
    expect(set.mipmapLevels).toEqual(4)
    expect(set.difficulty).toEqual(GameSetting.Difficulty.Easy)
    expect(set.renderClouds).toEqual(GameSetting.RenderClouds.Off)
    expect(set.fancyGraphics).toEqual(GameSetting.Graphics.Fast)
    expect(set.lastServer).toEqual('play.mcndsj.com')
    expect(set.particles).toEqual(GameSetting.Particles.Decreased)
    expect(set.resourcePacks).toStrictEqual(['Xray Ultimate 1.12 v2.2.1.zip', 'fabric:abc'])
    expect(set.lang).toEqual('en_US')
    expect(set.modelPart_hat).toEqual(true)
  })
  test('should not parse illegal option', () => {
    const set = GameSetting.parse('undefined:undefined\n', true)
    expect(set).toBeTruthy()
    expect((set as any).undefined).toEqual(undefined)
  })
  test('should parse output even if input string is empty', () => {
    const set = GameSetting.parse('', true)
    expect(set).toBeTruthy()
    expect(set.ao).toEqual(2)
    expect(set.fov).toEqual(0)
    expect(set.mipmapLevels).toEqual(4)
    expect(set.resourcePacks).toStrictEqual([])
    expect(set.lang).toEqual('en_us')
  })
  test('should write all options from frame', () => {
    const setting: GameSetting.Frame = {
      useVbo: false,
      fboEnable: false,
      enableVsync: false,
      fancyGraphics: false,
      renderClouds: false,
      forceUnicodeFont: false,
      autoJump: false,
      entityShadows: false,
      ao: 0,
      fov: 0,
      mipmapLevels: 0,
      maxFps: 0,
      particles: 0,
      renderDistance: 2,
      resourcePacks: ['asb'],
    }
    const str = GameSetting.stringify(setting)
    expect(str.indexOf('maxFps:0')).not.toEqual(-1)
    expect(str.indexOf('fboEnable:false')).not.toEqual(-1)
    expect(str.indexOf('enableVsync:false')).not.toEqual(-1)
    expect(str.indexOf('fancyGraphics:false')).not.toEqual(-1)
    expect(str.indexOf('resourcePacks:["asb"]')).not.toEqual(-1)
  })
  test('should write all options from instance', () => {
    const setting: GameSetting.Frame = {
      useVbo: false,
      fboEnable: false,
      enableVsync: false,
      fancyGraphics: false,
      renderClouds: false,
      forceUnicodeFont: false,
      autoJump: false,
      entityShadows: false,
      ao: 0,
      fov: 0,
      mipmapLevels: 1,
      maxFps: 0,
      particles: 0,
      renderDistance: 2,
      resourcePacks: [],
    }
    const str = GameSetting.stringify(setting)
    expect(str.indexOf('maxFps:0')).not.toEqual(-1)
    expect(str.indexOf('fboEnable:false')).not.toEqual(-1)
    expect(str.indexOf('enableVsync:false')).not.toEqual(-1)
    expect(str.indexOf('fancyGraphics:false')).not.toEqual(-1)
    expect(str.indexOf('resourcePacks:[]')).not.toEqual(-1)
  })
  test('should not write undefined', () => {
    const setting = {
      undefined,
    }
    const str = GameSetting.stringify(setting)
    expect(str.indexOf('undefined:undefined')).toEqual(-1)
  })
})

describe('decodeUnicodeEscapes', () => {
  test('should decode single unicode escape', () => {
    expect(decodeUnicodeEscapes('\\u4f60')).toEqual('你')
  })

  test('should decode multiple unicode escapes', () => {
    expect(decodeUnicodeEscapes('\\u4f60\\u597d\\u4e16\\u754c')).toEqual('你好世界')
  })

  test('should decode mixed ASCII and unicode escapes', () => {
    expect(decodeUnicodeEscapes('Hello \\u4e16\\u754c')).toEqual('Hello 世界')
  })

  test('should leave plain ASCII unchanged', () => {
    expect(decodeUnicodeEscapes('Hello World')).toEqual('Hello World')
  })

  test('should leave incomplete escape sequences unchanged', () => {
    expect(decodeUnicodeEscapes('\\u00')).toEqual('\\u00')
  })

  test('should handle empty string', () => {
    expect(decodeUnicodeEscapes('')).toEqual('')
  })

  test('should decode uppercase hex', () => {
    expect(decodeUnicodeEscapes('\\u4F60')).toEqual('你')
  })

  test('should handle Japanese characters', () => {
    // シェーダー = shader in Japanese
    const encoded = '\\u30b7\\u30a7\\u30fc\\u30c0\\u30fc'
    expect(decodeUnicodeEscapes(encoded)).toEqual('シェーダー')
  })

  test('should handle Korean characters', () => {
    const encoded = '\\ud55c\\uad6d\\uc5b4'
    expect(decodeUnicodeEscapes(encoded)).toEqual('한국어')
  })
})

describe('encodeUnicodeEscapes', () => {
  test('should encode single non-ASCII character', () => {
    expect(encodeUnicodeEscapes('你')).toEqual('\\u4f60')
  })

  test('should encode multiple non-ASCII characters', () => {
    expect(encodeUnicodeEscapes('你好世界')).toEqual('\\u4f60\\u597d\\u4e16\\u754c')
  })

  test('should encode mixed ASCII and non-ASCII', () => {
    expect(encodeUnicodeEscapes('Hello 世界')).toEqual('Hello \\u4e16\\u754c')
  })

  test('should leave plain ASCII unchanged', () => {
    expect(encodeUnicodeEscapes('Hello World')).toEqual('Hello World')
  })

  test('should handle empty string', () => {
    expect(encodeUnicodeEscapes('')).toEqual('')
  })

  test('should pad hex to 4 digits', () => {
    // © is U+00A9
    expect(encodeUnicodeEscapes('©')).toEqual('\\u00a9')
  })

  test('should handle Japanese characters', () => {
    expect(encodeUnicodeEscapes('シェーダー')).toEqual('\\u30b7\\u30a7\\u30fc\\u30c0\\u30fc')
  })
})

describe('unicode roundtrip', () => {
  test('should roundtrip Chinese text', () => {
    const original = '补全光影 - 高性能版'
    expect(decodeUnicodeEscapes(encodeUnicodeEscapes(original))).toEqual(original)
  })

  test('should roundtrip mixed content', () => {
    const original = 'BSL Shaders v8.2 - 光影包测试'
    expect(decodeUnicodeEscapes(encodeUnicodeEscapes(original))).toEqual(original)
  })

  test('should roundtrip pure ASCII', () => {
    const original = 'BSL_v8.2.01.zip'
    expect(decodeUnicodeEscapes(encodeUnicodeEscapes(original))).toEqual(original)
  })
})

describe('stringify with unicode', () => {
  test('should encode non-ASCII string values', () => {
    const setting: GameSetting.Frame = {
      lang: '中文',
    }
    const str = GameSetting.stringify(setting)
    expect(str).toContain('lang:\\u4e2d\\u6587')
    expect(str).not.toContain('中文')
  })

  test('should encode non-ASCII values in arrays', () => {
    const setting: GameSetting.Frame = {
      resourcePacks: ['测试包.zip'],
    }
    const str = GameSetting.stringify(setting)
    // stringify encodes non-ASCII in arrays, and JSON.stringify wraps with quotes
    expect(str).toContain('resourcePacks:')
    expect(str).not.toContain('测试包')
  })

  test('should roundtrip parse+stringify with unicode values', () => {
    const original = 'lang:\\u4e2d\\u6587\nresourcePacks:["\\u6d4b\\u8bd5"]'
    const parsed = GameSetting.parse(original)
    // parse() does NOT decode unicode escapes - it stores the raw escaped string
    // decodeUnicodeEscapes is used by higher-level consumers (shaderpack, InstanceOptionsService)
    expect(parsed.lang).toEqual('\\u4e2d\\u6587')
    // When we decode explicitly, it should give us the original Chinese text
    expect(decodeUnicodeEscapes(parsed.lang as string)).toEqual('中文')
    // stringify should preserve the escaped form
    const output = GameSetting.stringify(parsed)
    expect(output).toContain('lang:\\u4e2d\\u6587')
  })
})
