import { MockWallet } from './mockWallet';
import { mwaWallet } from './mwaWallet';

const USE_MOCK = __DEV__ && false; // true für Emulator-Tests ohne Wallet

export const wallet = USE_MOCK ? new MockWallet() : mwaWallet;
