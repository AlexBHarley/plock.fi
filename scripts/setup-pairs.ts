import { Networks } from '@celo-tools/use-contractkit';
import { newKit } from '@celo/contractkit';
import { AbiItem } from 'web3-utils';
import { getFornoUrl, tokens, ubeswap } from '../constants';
import FactoryAbi from '../utils/abis/uniswap/Factory.json';

const network = process.env.NETWORK;
const privateKey = process.env.PRIVATE_KEY;
const fornoUrl = getFornoUrl(network as Networks);
if (!network || !privateKey || !fornoUrl) {
  console.log('Missing or invalid environment variables');
  process.exit(1);
}

export async function main() {
  const kit = newKit(fornoUrl);
  kit.addAccount(privateKey);
  const [from] = kit.getWallet().getAccounts();

  const factory = new kit.web3.eth.Contract(
    FactoryAbi as AbiItem[],
    ubeswap.factoryAddress
  );

  for (const token0 of tokens) {
    for (const token1 of tokens) {
      if (!token0.networks[network] || !token1.networks[network]) {
        console.log(`Skipping ${token0.ticker} <> ${token1.ticker} pair`);
        continue;
      }

      try {
        console.log(`Creating ${token0.ticker} <> ${token1.ticker} pair`);
        await factory.methods
          .createPair(token0.networks[network], token1.networks[network])
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
