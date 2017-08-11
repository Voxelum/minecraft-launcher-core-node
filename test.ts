import { GameSetting } from './index'

import * as  fs from 'fs'

const content = fs.readFileSync('C:/Users/t-hox/AppData/Roaming/.launcher/profiles/5a7a10cb-cf87-4131-bf8d-00ad5f14cf7b/options.txt')
const setting = GameSetting.readFromString(content.toString())

console.log(setting)