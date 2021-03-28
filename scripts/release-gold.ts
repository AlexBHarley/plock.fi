import { newKit } from '@celo/contractkit';
import { add } from 'date-fns';
import { deployReleaseCelo } from '../utils/deploy-release-celo';

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();
  kit.defaultAccount = account;

  const start = new Date();
  const end = add(new Date(), { weeks: 1 });

  const releaseGoldAddress = await deployReleaseCelo(
    {
      start,
      end,
      from: account,
      to: account,
      amount: '0.1',
    },
    kit
  );

  console.log('Deployed', releaseGoldAddress);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
