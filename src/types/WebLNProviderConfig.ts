import {types} from '@getalby/sdk';

export type WebLNProviderConfig = {
  nwc?: {
    authorizationUrlOptions: types.GetNWCAuthorizationUrlOptions;
  };
  uma?: {
    authorizationUrlOptions: types.NWCAuthorizationUrlOptions;
    callbackUrl: string;
    identityNpub: string;
    identityRelayUrl: string;
  };
};
