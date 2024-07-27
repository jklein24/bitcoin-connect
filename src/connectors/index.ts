import {ExtensionConnector} from './ExtensionConnector';
import {LnbitsConnector} from './LnbitsConnector';
import {LNCConnector} from './LNCConnector';
import {NWCConnector} from './NWCConnector';
import {UMANWCConnector} from './UMANWCConnector';

export const connectors = {
  'extension.generic': ExtensionConnector,
  'nwc.alby': NWCConnector,
  'nwc.generic': NWCConnector,
  'nwc.mutiny': NWCConnector,
  'nwc.umbrel': NWCConnector,
  'nwc.uma': UMANWCConnector,
  lnbits: LnbitsConnector,
  lnc: LNCConnector,
};
