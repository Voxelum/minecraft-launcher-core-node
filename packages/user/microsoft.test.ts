import { MockAgent } from 'undici'
import { describe, expect, it } from 'vitest'
import { MicrosoftAuthenticator } from './microsoft'

describe('MicrosoftAuthenticator', () => {
  const agent = new MockAgent()
  describe('#authenticateXboxLive', () => {
    it('should be able to authenticate ', async () => {
      const pool = agent.get('https://user.auth.xboxlive.com')
      pool.intercept({
        method: 'POST',
        path: '/user/authenticate',
        body: JSON.stringify({
          Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: 'd=ci010',
          },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).reply(200, { hello: 'good' })
      const client = new MicrosoftAuthenticator(agent)
      await expect(client.authenticateXboxLive('ci010'))
        .resolves.toEqual({ hello: 'good' })
    })
  })

  it('should return XSTS token', async () => {
    // Arrange
    const xblResponseToken = 'some-token'
    const relyingParty = 'rp://api.minecraftservices.com/'
    const expectedToken = 'some-xsts-token'

    agent.get('https://xsts.auth.xboxlive.com')
      .intercept({
        method: 'POST',
        path: '/xsts/authorize',
        body: JSON.stringify({
          Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [xblResponseToken],
          },
          RelyingParty: relyingParty,
          TokenType: 'JWT',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .reply(200, { Token: expectedToken })

    // Act
    const client = new MicrosoftAuthenticator(agent)
    const result = await client.authorizeXboxLive(xblResponseToken, relyingParty)

    // Assert
    expect(result.Token).to.equal(expectedToken)
  })
})
