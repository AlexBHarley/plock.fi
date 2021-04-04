import { ContractKit } from '@celo/contractkit';
import { Address } from '@celo/utils/lib/address';
import { ubeswap } from '../constants';
import ERC20Abi from './abis/ERC20.json';
import RouterAbi from './abis/uniswap/Router.json';

export async function quote(
  kit: ContractKit,
  fromTokenAddress: Address,
  amount: string,
  toTokenAddress: string
) {
  const router = new kit.web3.eth.Contract(
    RouterAbi as any,
    ubeswap.routerAddress
  );

  const [, result] = await router.methods
    .getAmountsOut(amount, [fromTokenAddress, toTokenAddress])
    .call();
  return result;
}

export async function swap(
  kit: ContractKit,
  from: Address,
  to: Address,
  amount: string
) {
  const fromToken = new kit.web3.eth.Contract(ERC20Abi as any, from);
  await fromToken.methods
    .increaseAllowance(ubeswap.routerAddress, amount)
    .send({ from: kit.defaultAccount });

  const router = new kit.web3.eth.Contract(
    RouterAbi as any,
    ubeswap.routerAddress
  );
  await router.methods
    .swapExactTokensForTokens(
      amount,
      1,
      [from, to],
      kit.defaultAccount,
      Date.now() + 10000000
    )
    .send({
      from: kit.defaultAccount,
    });
}
