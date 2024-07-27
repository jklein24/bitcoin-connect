import {customElement, state} from 'lit/decorators.js';
import {BitcoinConnectElement} from '../BitcoinConnectElement';
import {withTwind} from '../twind/withTwind';
import {html} from 'lit';
import '../internal/bci-button';
import {classes} from '../css/classes';
import store from '../../state/store';
import {auth} from '@getalby/sdk';
import {baseUrlFromUmaDomain} from '../../utils/uma';

@customElement('bc-uma')
export class UmaPage extends withTwind()(BitcoinConnectElement) {
  @state()
  private _umaAddress = '';

  override render() {
    return html`<div class="w-full">
      <bc-navbar class="flex w-full" heading="UMA NWC"></bc-navbar>
      <div class="font-sans text-sm w-full">
        <div class="px-8 pt-4 w-full">
          <div class="mb-1 ${classes['text-neutral-secondary']}">
            Enter your UMA address below
          </div>

          <input
            value=${this._umaAddress}
            @change=${this.umaAddressChanged}
            placeholder="$icanhodl@uma.me"
            class="w-full mb-8 rounded-lg p-2 border-1 ${classes[
              'border-neutral-secondary'
            ]}"
          />
          <bci-button @click=${this.onConnect}>
            <span class="${classes['text-brand-mixed']}"
              >Create Connection</span
            >
          </bci-button>
        </div>
      </div>
    </div>`;
  }

  private umaAddressChanged(event: {target: HTMLInputElement}) {
    // TODO: validate UMA address
    this._umaAddress = event.target.value;
  }
  private async onConnect() {
    if (!this._umaAddress) {
      store.getState().setError('Please enter an UMA address');
      return;
    }

    const addressParts = this._umaAddress.split('@');
    if (addressParts.length !== 2) {
      store.getState().setError('Invalid UMA address');
      return;
    }

    const addressDomain = addressParts[1];
    const baseUrl = baseUrlFromUmaDomain(addressDomain);

    const providerConfig = store.getState().bitcoinConnectConfig.providerConfig;
    const umaConfig = providerConfig?.uma ?? {
      callbackUrl: 'localhost:8080/callback',
      identityNpub: 'npub',
      identityRelayUrl: 'wss://nos.lol',
    };
    const authClient = new auth.OAuth2User({
      client_id: `${umaConfig.identityNpub} ${umaConfig.identityRelayUrl}`,
      callback: umaConfig.callbackUrl,
      scopes: [],
      user_agent: 'bc-uma',
      request_options: {
        base_url: baseUrl,
      },
    });

    const authUrl = await authClient.generateAuthURL({
      authorizeUrl: `${baseUrl}/oauth/auth`,
      code_challenge_method: 'S256',
      ...(providerConfig?.nwc?.authorizationUrlOptions || {}),
    });
    store.getState().setOauthState({
      codeVerifier: authClient.code_verifier || '',
      umaConfig: {
        ...umaConfig,
        umaDomain: addressDomain,
      },
    });

    window.localStorage.setItem(
      'bc:config',
      JSON.stringify({
        connectorName: 'UMA NWC',
        connectorType: 'nwc.uma',
      })
    );

    window.location.href = authUrl;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-uma': UmaPage;
  }
}
