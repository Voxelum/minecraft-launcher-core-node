import { describe, expect, it } from 'vitest'
import { offline } from './offline'

describe('#offline', () => {
  it('should be able to login ', () => {
    const offlineUser = offline('ci010')
    expect(offlineUser.selectedProfile.name).toEqual('ci010')
    expect(offlineUser.selectedProfile.id).toBeTruthy()
    expect(offlineUser.accessToken).toBeTruthy()
    expect(offlineUser.clientToken).toBeTruthy()
    expect(offlineUser.user!.id).toBeTruthy()
  })
})
