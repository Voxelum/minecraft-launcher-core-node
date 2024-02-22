import { createHash } from 'crypto'
import { v4 } from 'uuid'

/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
export function newToken() {
  return v4().replace(/-/g, '')
}

export function getUUIDOfOfflinePlayer(username: string) {
  const md5Bytes = createHash('md5').update(`OfflinePlayer:${username}`).digest()
  md5Bytes[6] &= 0x0f /* clear version        */
  md5Bytes[6] |= 0x30 /* set to version 3     */
  md5Bytes[8] &= 0x3f /* clear variant        */
  md5Bytes[8] |= 0x80 /* set to IETF variant  */
  return md5Bytes.toString('hex')
}

/**
 * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
 *
 * @param username The username you want to have in-game.
 */
export function offline(username: string, uuid?: string) {
  const id = (uuid || getUUIDOfOfflinePlayer(username))
  const prof = {
    id,
    name: username,
  }
  return {
    accessToken: newToken(),
    clientToken: newToken(),
    selectedProfile: prof,
    availableProfiles: [prof],
    user: {
      id,
      username,
    },
  }
}
