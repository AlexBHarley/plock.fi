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

  mCELO = 'mCELO',
  mcUSD = 'mcUSD',
  mcEUR = 'mcEUR',
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
    [NetworkNames.Alfajores]: '0x10c892a6ec43a53e45d0b916b4b7d383b1b78c0f',
    [NetworkNames.Mainnet]: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
    [NetworkNames.Baklava]: '0xf9ecE301247aD2CE21894941830A2470f4E774ca',
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
export const mCELO: Token = {
  ticker: TokenTicker.mCELO,
  name: 'mCELO AToken',
  networks: {
    [NetworkNames.Alfajores]: '0x86f61EB83e10e914fc6F321F5dD3c2dD4860a003',
    [NetworkNames.Mainnet]: '0x7037F7296B2fc7908de7b57a89efaa8319f0C500',
  },
};
export const mcUSD: Token = {
  ticker: TokenTicker.mcUSD,
  name: 'mcUSD AToken',
  networks: {
    [NetworkNames.Alfajores]: '0x71DB38719f9113A36e14F409bAD4F07B58b4730b',
    [NetworkNames.Mainnet]: '0x64dEFa3544c695db8c535D289d843a189aa26b98',
  },
};
export const mcEUR: Token = {
  ticker: TokenTicker.mcEUR,
  name: 'mcEUR AToken',
  networks: {
    [NetworkNames.Alfajores]: '0x32974C7335e649932b5766c5aE15595aFC269160',
    [NetworkNames.Mainnet]: '0xa8d0E6799FF3Fd19c6459bf02689aE09c4d78Ba7',
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
  mCELO,
  mcUSD,
  mcEUR,
];

export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
}
