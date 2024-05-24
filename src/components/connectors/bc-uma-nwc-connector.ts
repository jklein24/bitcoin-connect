import {customElement} from 'lit/decorators.js';
import {ConnectorElement} from './ConnectorElement';
import store from '../../state/store';
import {umaIcon} from '../icons/connectors/umaIcon';

export const umaNWCConnectorTitle = 'UMA';

@customElement('bc-uma-nwc-connector')
export class UmaNWCConnector extends ConnectorElement {
  constructor() {
    super('nwc.uma', umaNWCConnectorTitle, '#ffffff', umaIcon);
  }

  protected async _onClick() {
    store.getState().pushRoute('/uma');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'bc-uma-nwc-connector': UmaNWCConnector;
  }
}
