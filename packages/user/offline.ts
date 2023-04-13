import { v3, v4 } from 'uuid'

/**
 * Random generate a new token by uuid v4. It can be client or auth token.
 * @returns a new token
 */
export function newToken() {
  return v4().replace(/-/g, '')
}

/**
 * Create an offline auth. It'll ensure the user game profile's `uuid` is the same for the same `username`.
 *
 * @param username The username you want to have in-game.
 */
export function offline(username: string, uuid?: string) {
  const id = (uuid || v3(username, '00000000-0000-0000-0000-000000000000')).replace(/-/g, '')
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
