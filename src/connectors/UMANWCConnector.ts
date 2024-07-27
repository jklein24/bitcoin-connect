import {auth, webln} from '@getalby/sdk';
import {Connector} from './Connector';
import {ConnectorConfig} from '../types/ConnectorConfig';
import {WebLNProvider} from '@webbtc/webln-types';
import store from '../state/store';
import {Token} from '@getalby/sdk/dist/types';
import {baseUrlFromUmaDomain} from '../utils/uma';

export class UMANWCConnector extends Connector {
  constructor(config: ConnectorConfig) {
    super(config);
  }

  async init(): Promise<WebLNProvider> {
    const oauthState = store.getState().oAuthState;
    const refreshToken = oauthState?.umaConfig?.refreshToken;
    const accessTokenExpiresAt = oauthState?.umaConfig?.accessTokenExpiresAt;

    if (
      this._config.nwcUrl &&
      (!accessTokenExpiresAt || accessTokenExpiresAt < Date.now())
    ) {
      return new webln.NostrWebLNProvider({
        nostrWalletConnectUrl: this._config.nwcUrl,
      });
    }

    if (refreshToken) {
      return await this.tokenRefresh();
    }

    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      return await this.tokenExchange(code);
    }

    throw new Error('no refresh token or code');
  }

  async tokenExchange(code: string): Promise<WebLNProvider> {
    const oauthState = store.getState().oAuthState;
    const umaConfig = oauthState?.umaConfig;
    if (!oauthState || !umaConfig) {
      throw new Error('invalid oauth state');
    }
    const authClient = new auth.OAuth2User({
      client_id: `${umaConfig.identityNpub} ${umaConfig.identityRelayUrl}`,
      callback: umaConfig.callbackUrl,
      scopes: [],
      user_agent: 'bc-uma',
      request_options: {
        base_url: baseUrlFromUmaDomain(umaConfig.umaDomain),
      },
    });
    authClient.code_verifier = oauthState.codeVerifier;
    const token = (await authClient.requestAccessToken(code)).token as Token & {
      nwc_connection_uri: string;
      commands: string[];
      budget: string;
      nwc_expires_at: number;
    };

    store.getState().setOauthState({
      codeVerifier: '',
      umaConfig: {
        ...umaConfig,
        refreshToken: token.refresh_token,
        accessToken: token.access_token,
        accessTokenExpiresAt: token.expires_at,
      },
    });

    window.localStorage.setItem(
      'bc:config',
      JSON.stringify({
        connectorName: 'UMA NWC',
        connectorType: 'nwc.uma',
        nwcUrl: token.nwc_connection_uri,
      })
    );
    return new webln.NostrWebLNProvider({
      nostrWalletConnectUrl: token.nwc_connection_uri,
    });
  }

  async tokenRefresh(): Promise<WebLNProvider> {
    const oauthState = store.getState().oAuthState;
    const umaConfig = oauthState?.umaConfig;
    if (!oauthState || !umaConfig) {
      throw new Error('invalid oauth state');
    }
    const authClient = new auth.OAuth2User({
      client_id: `${umaConfig.identityNpub} ${umaConfig.identityRelayUrl}`,
      callback: umaConfig.callbackUrl,
      scopes: [],
      user_agent: 'bc-uma',
      request_options: {
        base_url: baseUrlFromUmaDomain(umaConfig.umaDomain),
      },
    });
    authClient.token = {
      access_token: umaConfig.accessToken,
      refresh_token: umaConfig.refreshToken,
      expires_at: umaConfig.accessTokenExpiresAt,
    };
    const token = (await authClient.refreshAccessToken()).token as Token & {
      nwc_connection_uri: string;
      commands: string[];
      budget: string;
      nwc_expires_at: number;
    };

    store.getState().setOauthState({
      codeVerifier: '',
      umaConfig: {
        ...umaConfig,
        refreshToken: token.refresh_token,
        accessToken: token.access_token,
        accessTokenExpiresAt: token.expires_at,
      },
    });

    window.localStorage.setItem(
      'bc:config',
      JSON.stringify({
        connectorName: 'UMA NWC',
        connectorType: 'nwc.uma',
        nwcUrl: token.nwc_connection_uri,
      })
    );
    return new webln.NostrWebLNProvider({
      nostrWalletConnectUrl: token.nwc_connection_uri,
    });
  }
}
