import BigNumber from 'bignumber.js';
import Web3 from 'web3';

export function formatAmount(raw: string | BigNumber, decimalPlaces: number) {
  const wei = typeof raw === 'string' ? raw : raw.toFixed(0);
  const ether = Web3.utils.fromWei(wei, 'ether');

  const [integer, decimals] = ether.split('.');

  if (decimals) {
    return `${integer}.${decimals.slice(0, 2)}`;
  }
  return integer;
}

export function toWei(raw: string) {
  if (!raw) {
    return '0';
  }

  try {
    return Web3.utils.toWei(raw, 'ether');
  } catch (_) {
    return 'Invalid number';
  }
}
