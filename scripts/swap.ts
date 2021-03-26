import { newKit } from '@celo/contractkit';
import { Address } from '@celo/utils/lib/address';

import Factory from './abis/uniswap/Factory.json';
import Pair from './abis/uniswap/Pair.json';
import RouterAbi from './abis/uniswap/Router.json';
import ERC20Abi from './abis/ERC20.json';

const factoryAddress = '0x62d5b84be28a183abb507e125b384122d2c25fae';
const routerAddress = '0xe3d8bd6aed4f159bc8000a9cd47cffdb95f96121';

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();

  // @ts-ignore
  const factory = new kit.web3.eth.Contract(Factory.abi, factoryAddress);
  // @ts-ignore
  const router = new kit.web3.eth.Contract(RouterAbi, routerAddress);

  const goldToken = await kit.contracts.getGoldToken();
  const stableToken = await kit.contracts.getStableToken();

  const pairCount = await factory.methods.allPairsLength().call();

  console.log('\nAvailable pairs');
  await Promise.all(
    Array(pairCount)
      .fill(null)
      .map(async (_, index) => {
        const pairAddress = await factory.methods.allPairs(index).call();
        // @ts-ignore
        const pair = new kit.web3.eth.Contract(Pair.abi, pairAddress);

        console.log(
          await pair.methods.symbol().call(),
          `${await pair.methods
            .token0()
            .call()} <> ${await pair.methods.token1().call()}`
        );
      })
  );
  console.log('');

  async function swap(from: Address, to: Address, amount: string) {
    // @ts-ignore
    const fromToken = new kit.web3.eth.Contract(ERC20Abi, from);
    await fromToken.methods
      .increaseAllowance(routerAddress, amount)
      .send({ from: account });

    await router.methods
      .swapExactTokensForTokens(
        1,
        1,
        [from, to],
        account,
        Date.now() + 10000000
      )
      .send({
        from: account,
      });
  }

  try {
    console.log(
      'goldToken balance',
      await (await goldToken.balanceOf(account)).toFixed()
    );
    console.log(
      'stableToken balance',
      await (await stableToken.balanceOf(account)).toFixed()
    );

    await swap(goldToken.address, stableToken.address, '1');

    console.log(
      'goldToken balance',
      await (await goldToken.balanceOf(account)).toFixed()
    );
    console.log(
      'stableToken balance',
      await (await stableToken.balanceOf(account)).toFixed()
    );
  } catch (e) {
    console.log(e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
