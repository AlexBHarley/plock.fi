import {
  NetworkNames,
  Alfajores,
  Baklava,
  Mainnet,
} from '@celo-tools/use-contractkit';
import { newKit } from '@celo/contractkit';
import { eqAddress } from '@celo/utils/lib/address';
import { AbiItem } from 'web3-utils';
import { tokens, ubeswap } from '../constants';
import FactoryAbi from '../utils/abis/uniswap/Factory.json';

const networks = [Mainnet, Baklava, Alfajores];

const network = networks.find((n) => n.name === process.env.NETWORK);
const privateKey = process.env.PRIVATE_KEY;
if (!network || !privateKey) {
  console.log('Missing or invalid environment variables');
  process.exit(1);
}

export async function main() {
  const kit = newKit(network.rpcUrl);
  kit.addAccount(privateKey);
  const [from] = kit.getWallet().getAccounts();

  const factory = new kit.web3.eth.Contract(
    FactoryAbi as AbiItem[],
    ubeswap.factoryAddress
  );

  for (const token0 of tokens) {
    for (const token1 of tokens) {
      const token0Address = token0.networks[network.name];
      const token1Address = token1.networks[network.name];

      if (eqAddress(token0Address, token1Address)) {
        continue;
      }

      if (!token0Address || !token1Address) {
        console.log(`Skipping ${token0.ticker} <> ${token1.ticker} pair`);
        continue;
      }

      try {
        console.log(`Creating ${token0.ticker} <> ${token1.ticker} pair`);
        await factory.methods
          .createPair(
            token0.networks[network.name],
            token1.networks[network.name]
          )
          .send({ from });
        console.log('Created!');
      } catch (e) {
        console.log(e.message);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
