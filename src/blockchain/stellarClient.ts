import StellarSdk, {Networks} from 'stellar-sdk';
import {config} from '../config';

const networkPassphrase = config.stellarNetwork === 'public' ? Networks.PUBLIC : Networks.TESTNET;
const horizonUrl = config.stellarNetwork === 'public'
  ? 'https://horizon.stellar.org'
  : 'https://horizon-testnet.stellar.org';

export const stellarServer = new StellarSdk.Server(horizonUrl);
export const stellarNetworkPassphrase = networkPassphrase;
