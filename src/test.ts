import { GameSetting } from './minecraft'

import * as fs from 'fs'
let s = fs.readFileSync('C:/Users/CIJhn/Workspace/Output/Standard/.minecraft/options.txt')
let setting = GameSetting.readFromString(s.toString())
console.log(setting)