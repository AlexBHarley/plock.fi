import { Networks } from '@celo-tools/use-contractkit';
export * from './tokens';
export * as ubeswap from './ubeswap';

const apiUrls = {
  [Networks.Alfajores]:
    'https://alfajores-blockscout.celo-testnet.org/graphiql',
  [Networks.Baklava]: 'https://baklava-blockscout.celo-testnet.org/graphiql',
  [Networks.Mainnet]: 'https://explorer.celo.org/graphiql',
};

export function getGraphQlUrl(n: Networks) {
  return apiUrls[n];
}

const fornoUrls = {
  [Networks.Alfajores]: 'https://alfajores-forno.celo-testnet.org',
  [Networks.Baklava]: 'https://baklava-forno.celo-testnet.org',
  [Networks.Mainnet]: 'https://forno.celo.org',
};

export function getFornoUrl(n: Networks) {
  return fornoUrls[n];
}
