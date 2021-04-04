import { newKit } from '@celo/contractkit';
import ERC20Abi from '../packages/app/utils/abis/ERC20.json';
import { ubeswap } from '../packages/app/constants';
import FactoryAbi from '../packages/app/utils/abis/uniswap/Factory.json';
import PairAbi from '../packages/app/utils/abis/uniswap/Pair.json';
import { quote, swap } from '../packages/app/utils/uniswap';
import Web3 from 'web3';

const ONE = Web3.utils.toWei('10');
Web3.utils.fromWei;

export async function main() {
  const kit = newKit('https://forno.celo.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();
  kit.defaultAccount = account;

  const stableToken = await kit.contracts.getStableToken();
  const goldToken = await kit.contracts.getGoldToken();
  const exchange = await kit.contracts.getExchange();

  console.table({
    stable: await (await stableToken.balanceOf(account)).toString(),
    gold: await (await goldToken.balanceOf(account)).toString(),
  });
  console.log(
    'stable',
    Web3.utils.fromWei((await stableToken.balanceOf(account)).toString())
  );
  console.log(
    'gold',
    Web3.utils.fromWei((await goldToken.balanceOf(account)).toString())
  );

  console.log('Mento');
  const stableNeeded = Web3.utils.fromWei(
    (await exchange.quoteGoldBuy(ONE)).toString()
  );
  const goldNeeded = Web3.utils.fromWei(
    (await exchange.quoteStableBuy(ONE)).toString()
  );

  const stableGained = Web3.utils.fromWei(
    (await exchange.quoteGoldSell(ONE)).toString()
  );
  const goldGained = Web3.utils.fromWei(
    (await exchange.quoteStableSell(ONE)).toString()
  );

  console.table({ stableNeeded, goldNeeded, stableGained, goldGained });

  console.log('uniswap');
  const uniStableGained = Web3.utils.fromWei(
    (await quote(kit, goldToken.address, ONE, stableToken.address)).toString()
  );
  const uniGoldGained = Web3.utils.fromWei(
    (await quote(kit, stableToken.address, ONE, goldToken.address)).toString()
  );

  console.table({ uniStableGained, uniGoldGained });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
