import {customElement, state} from 'lit/decorators.js';
import {BitcoinConnectElement} from '../BitcoinConnectElement';
import {withTwind} from '../twind/withTwind';
import {html} from 'lit';
import '../internal/bci-button';
import {classes} from '../css/classes';
import store from '../../state/store';
import {webln} from '@getalby/sdk';

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
    const nwc = webln.NostrWebLNProvider.withNewSecret({
      authorizationUrl: `http://${addressDomain}/apps/new`,
      relayUrl: 'wss://relay.getalby.com/v1', // TODO: use custom relay from providerConfig
      walletPubkey:
        'a421a5e2a615eff3b797be5318e4e687df4b100748cfaa8d0b390ce659906d8f',
    });
    const providerConfig = store.getState().bitcoinConnectConfig.providerConfig;
    await nwc.initNWC({
      ...(providerConfig?.nwc?.authorizationUrlOptions || {}),
      name: this._appName,
    });

    store.getState().connect({
      nwcUrl: nwc.getNostrWalletConnectUrl(true),
      connectorName: 'UMA NWC',
      connectorType: 'nwc.uma',
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-uma': UmaPage;
  }
}
