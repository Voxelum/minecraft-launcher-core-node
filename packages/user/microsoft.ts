/* eslint-disable camelcase */
import { Dispatcher, fetch } from 'undici'

export interface XBoxResponse {
  IssueInstant: string
  NotAfter: string
  Token: string
  DisplayClaims: {
    xui: [
      {
        /**
                 * gamer tag
                 */
        gtg: string
        /**
                 * user id
                 */
        xid: string
        uhs: string
      },
    ]
  }
}

export interface XBoxGameProfileResponse {
  profileUsers: [{
    id: string
    hostId: string | null
    settings: [{
      'id': 'Gamertag'
      'value': string
    }, {
      'id': 'PublicGamerpic'
      'value': string
    }]
    isSponsoredUser: boolean
  }]
}

export interface MinecraftAuthResponse {
  username: string // this is not the uuid of the account
  roles: []
  access_token: string // jwt, your good old minecraft access token
  token_type: 'Bearer'
  expires_in: number
}

/**
 * The microsoft authenticator for Minecraft (Xbox) account.
 */
export class MicrosoftAuthenticator {
  constructor(private dispatcher?: Dispatcher) { }

  /**
   * Authenticate with xbox live by ms oauth access token
   * @param oauthAccessToken The oauth access token
   */
  async authenticateXboxLive(oauthAccessToken: string, signal?: AbortSignal) {
    const xblResponse = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `d=${oauthAccessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      dispatcher: this.dispatcher,
      signal,
    })

    const result = await xblResponse.json() as XBoxResponse

    return result
  }

  /**
     * Authorize the xbox live. It will get the xsts token in response.
     * @param xblResponseToken The {@link XBoxResponse.Token}
     */
  async authorizeXboxLive(xblResponseToken: string, relyingParty: 'rp://api.minecraftservices.com/' | 'http://xboxlive.com' = 'rp://api.minecraftservices.com/', signal?: AbortSignal) {
    const xstsResponse = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xblResponseToken],
        },
        RelyingParty: relyingParty,
        TokenType: 'JWT',
      }),
      dispatcher: this.dispatcher,
      signal,
    })

    const result = await xstsResponse.json() as XBoxResponse

    return result
  }

  /**
     * Get xbox user profile, including **username** and **avatar**.
     *
     * You can find the parameters from the {@link XBoxResponse}.
     *
     * @param xuid The `xuid` in a {@link XBoxResponse.DisplayClaims}
     * @param uhs The `uhs` in a {@link XBoxResponse.DisplayClaims}
     * @param xstsToken The {@link XBoxResponse.Token}
     * @returns The user game profile.
     */
  async getXboxGameProfile(xuid: string, uhs: string, xstsToken: string, signal?: AbortSignal) {
    const url = new URL(`https://profile.xboxlive.com/users/xuid(${xuid})/profile/settings`)
    url.searchParams.append('settings', ['PublicGamerpic', 'Gamertag'].join(','))
    const response = await fetch(url, {
      headers: {
        'x-xbl-contract-version': '2',
        'content-type': 'application/json',
        Authorization: `XBL3.0 x=${uhs};${xstsToken}`,
      },
      dispatcher: this.dispatcher,
      signal,
    })

    const result = await response.json() as XBoxGameProfileResponse
    return result
  }

  /**
     * Acquire both Minecraft and xbox token and xbox game profile.
     * You can use the xbox token to login Minecraft by {@link loginMinecraftWithXBox}.
     *
     * This method is the composition of calling
     * - {@link authenticateXboxLive}
     * - {@link authorizeXboxLive} to `rp://api.minecraftservices.com/`
     * - {@link authorizeXboxLive} to `http://xboxlive.com`
     * - {@link getXboxGameProfile}
     *
     * You can call them individually if you want a more detailed control.
     *
     * @param oauthAccessToken The microsoft access token
     * @param signal The abort signal
     * @returns The object contain xstsResponse (minecraft xbox token) and xbox game profile
     */
  async acquireXBoxToken(oauthAccessToken: string, signal?: AbortSignal) {
    const xblResponse: XBoxResponse = await this.authenticateXboxLive(oauthAccessToken, signal)
    const minecraftXstsResponse: XBoxResponse = await this.authorizeXboxLive(xblResponse.Token, 'rp://api.minecraftservices.com/', signal)
    const xstsResponse: XBoxResponse = await this.authorizeXboxLive(xblResponse.Token, 'http://xboxlive.com', signal)

    return { minecraftXstsResponse, liveXstsResponse: xstsResponse }
  }

  /**
     * This will return the response with Minecraft access token!
     *
     * This access token allows us to launch the game, but, we haven't actually checked if the account owns the game. Everything until here works with a normal Microsoft account!
     *
     * @param uhs uhs from {@link XBoxResponse} of {@link acquireXBoxToken}
     * @param xstsToken You need to get this token from {@link acquireXBoxToken}
     */
  async loginMinecraftWithXBox(uhs: string, xstsToken: string, signal?: AbortSignal) {
    const mcResponse = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${uhs};${xstsToken}`,
      }),
      headers: {
        'content-type': 'application/json',
      },
      dispatcher: this.dispatcher,
      signal,
    })

    const result = await mcResponse.json() as MinecraftAuthResponse

    return result
  }
}
