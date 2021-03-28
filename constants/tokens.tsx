import { Networks } from '@celo-tools/use-contractkit';

export enum TokenTicker {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
}

export const tokens = [
  {
    ticker: TokenTicker.CELO,
    name: 'Celo',
    networks: {
      [Networks.Alfajores]: '0xF194afDf50B03e69Bd7D057c1Aa9e10c9954E4C9',
      [Networks.Mainnet]: '0x471EcE3750Da237f93B8E339c536989b8978a438',
      [Networks.Baklava]: '0xdDc9bE57f553fe75752D61606B94CBD7e0264eF8',
    },
  },
  {
    ticker: TokenTicker.cUSD,
    name: 'Celo Dollar',
    networks: {
      [Networks.Alfajores]: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1',
      [Networks.Mainnet]: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      [Networks.Baklava]: '0x62492A644A588FD904270BeD06ad52B9abfEA1aE',
    },
  },
  {
    ticker: TokenTicker.cEUR,
    name: 'Celo Euro',
    networks: {
      [Networks.Alfajores]: '',
      [Networks.Mainnet]: '',
      [Networks.Baklava]: '',
    },
  },
];

export enum FiatCurrency {
  USD = 'USD',
  EUR = 'EUR',
}
