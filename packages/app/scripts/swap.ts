import { newKit } from '@celo/contractkit';
import { ubeswap } from '../constants';
import FactoryAbi from '../utils/abis/uniswap/Factory.json';
import PairAbi from '../utils/abis/uniswap/Pair.json';
import { quote, swap } from '../utils/uniswap';

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();
  kit.defaultAccount = account;

  const factory = new kit.web3.eth.Contract(
    FactoryAbi as any,
    ubeswap.factoryAddress
  );

  const goldToken = await kit.contracts.getGoldToken();
  const stableToken = await kit.contracts.getStableToken();

  const pairCount = await factory.methods.allPairsLength().call();

  console.log('\nAvailable pairs');
  await Promise.all(
    Array(pairCount)
      .fill(null)
      .map(async (_, index) => {
        const pairAddress = await factory.methods.allPairs(index).call();
        const pair = new kit.web3.eth.Contract(PairAbi as any, pairAddress);

        console.log(
          await pair.methods.symbol().call(),
          `${await pair.methods
            .token0()
            .call()} <> ${await pair.methods.token1().call()}`
        );
      })
  );
  console.log('');

  console.log(
    'goldToken balance',
    await (await goldToken.balanceOf(account)).toFixed()
  );
  console.log(
    'stableToken balance',
    await (await stableToken.balanceOf(account)).toFixed()
  );

  const amount = '1';
  const quoteAmount = await quote(
    kit,
    goldToken.address,
    amount,
    stableToken.address
  );
  console.log('Quoted', quoteAmount);
  await swap(kit, account, goldToken.address, stableToken.address, amount);

  console.log(
    'goldToken balance',
    await (await goldToken.balanceOf(account)).toFixed()
  );
  console.log(
    'stableToken balance',
    await (await stableToken.balanceOf(account)).toFixed()
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
