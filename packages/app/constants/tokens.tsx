import { NetworkNames } from '@celo-tools/use-contractkit';

export enum TokenTicker {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
  vMOJO = 'vMOJO',
  PesabaseDollar = 'pUSD',
  MutualCreditResourceSystem = 'MCRS',
  DexfairGovernanceToken = 'XGP',
  Unifty = 'NIF',
  Ubeswap = 'ULP',
  cMC02 = 'cMC02',
}

export interface Token {
  ticker: TokenTicker;
  name: string;
  networks: {
    [key in NetworkNames]?: string;
  };
}

export const Celo: Token = {
  ticker: TokenTicker.CELO,
  name: 'Celo',
  networks: {
    [NetworkNames.Alfajores]: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
    [NetworkNames.Mainnet]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
    [NetworkNames.Baklava]: '0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8',
  },
};
export const cUSD: Token = {
  ticker: TokenTicker.cUSD,
  name: 'Celo Dollar',
  networks: {
    [NetworkNames.Alfajores]: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
    [NetworkNames.Mainnet]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
    [NetworkNames.Baklava]: '0x62492A644A588FD904270BeD06ad52B9abfEA1aE',
  },
};
export const cEUR: Token = {
  ticker: TokenTicker.cEUR,
  name: 'Celo Euro',
  networks: {
    [NetworkNames.Alfajores]: '',
    [NetworkNames.Mainnet]: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    [NetworkNames.Baklava]: '',
  },
};
export const Keykoin: Token = {
  ticker: TokenTicker.vMOJO,
  name: 'vMOJO',
  networks: {
    [NetworkNames.Alfajores]: '',
    [NetworkNames.Baklava]: '0xb6790ae0634f2439094e9bce08702f9261fe69c0',
    [NetworkNames.Mainnet]: '0x39d6477522eb543d750af82537325fb2930c1aa6',
  },
};
export const PesabaseDollar: Token = {
  ticker: TokenTicker.PesabaseDollar,
  name: 'Pesabase Dollar',
  networks: {
    [NetworkNames.Mainnet]: '0x041954f3f34422af8d1f11fd743f3a1b70c30271',
  },
};
export const MutualCreditResourceSystem: Token = {
  ticker: TokenTicker.MutualCreditResourceSystem,
  name: 'Mutual Credit Resource System',
  networks: {
    [NetworkNames.Mainnet]: '0x39049c02a56c3ecd046f6c2a9be0cffa2bc29c08',
  },
};
export const DexfairGovernanceToken: Token = {
  ticker: TokenTicker.DexfairGovernanceToken,
  name: 'Dexfair Governance Token',
  networks: {
    [NetworkNames.Mainnet]: '0xf06768797ba4e86abfa5adfbfd223742f2657960',
  },
};
export const Unifty: Token = {
  ticker: TokenTicker.Unifty,
  name: 'Unifty',
  networks: {
    [NetworkNames.Mainnet]: '0x3df39266f1246128c39086e1b542db0148a30d8c',
  },
};
export const Ubeswap: Token = {
  ticker: TokenTicker.Ubeswap,
  name: 'Ubeswap LP Token',
  networks: {
    [NetworkNames.Mainnet]: '0x1e593f1fe7b61c53874b54ec0c59fd0d5eb8621e',
  },
};
export const cMC02: Token = {
  ticker: TokenTicker.cMC02,
  name: 'MCO2 Token',
  networks: {
    [NetworkNames.Mainnet]: '0x32a9fe697a32135bfd313a6ac28792dae4d9979d',
  },
};

export const tokens: Token[] = [
  Celo,
  cUSD,
  cEUR,
  Keykoin,
  PesabaseDollar,
  MutualCreditResourceSystem,
  DexfairGovernanceToken,
  Unifty,
  Ubeswap,
  cMC02,
];

export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
}
