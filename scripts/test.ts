import { newKit } from '@celo/contractkit';

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');

  const stableToken = await kit.contracts.getStableToken();
  const goldToken = await kit.contracts.getGoldToken();

  console.log('stableToken.address', stableToken.address);
  console.log('goldToken.address', goldToken.address);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
