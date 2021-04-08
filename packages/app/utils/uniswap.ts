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
  address: Address,
  fromTokenAddress: Address,
  toTokenAddress: Address,
  amount: string
) {
  const fromToken = new kit.web3.eth.Contract(
    ERC20Abi as any,
    fromTokenAddress
  );
  await fromToken.methods
    .increaseAllowance(ubeswap.routerAddress, amount)
    .send({ from: address });

  const router = new kit.web3.eth.Contract(
    RouterAbi as any,
    ubeswap.routerAddress
  );
  await router.methods
    .swapExactTokensForTokens(
      amount,
      1,
      [fromTokenAddress, toTokenAddress],
      address,
      Date.now() + 10000000
    )
    .send({
      from: address,
    });
}
