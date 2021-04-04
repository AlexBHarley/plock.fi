import { NetworkNames } from '@celo-tools/use-contractkit';
import { newKit } from '@celo/contractkit';
import { Aave } from '../packages/app/utils/aave';
import { ubeswap } from '../packages/app/constants';
import FactoryAbi from '../packages/app/utils/abis/uniswap/Factory.json';
import PairAbi from '../packages/app/utils/abis/uniswap/Pair.json';
import { quote, swap } from '../packages/app/utils/uniswap';
import Web3 from 'web3';
import { formatAmount } from '../packages/app/utils';

const ONE = Web3.utils.toWei('10');

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();
  kit.defaultAccount = account;

  const goldToken = await kit.contracts.getGoldToken();
  const stableToken = await kit.contracts.getStableToken();
  console.log(
    formatAmount(await goldToken.balanceOf(account)),
    formatAmount(await stableToken.balanceOf(account))
  );

  const aave = await Aave(kit, NetworkNames.Alfajores, account);
  const goldReserve = await aave.getReserveAddress(goldToken.address);
  const stableReserve = await aave.getReserveAddress(stableToken.address);
  // console.table(await aave.getUserReserveData(goldReserve, account));
  // console.table(await aave.getUserReserveData(stableReserve, account));

  // await aave.deposit(stableToken.address, ONE);
  // await aave.deposit(goldToken.address, ONE);
  // console.table(await aave.getUserAccountData(kit.defaultAccount));

  await aave.borrow(stableToken.address, ONE, 'variable');
  console.table(await aave.getUserAccountData(account));
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
