import { newKit } from '@celo/contractkit';
import ERC20Abi from '../utils/abis/ERC20.json';

export async function main() {
  const kit = newKit('https://alfajores-forno.celo-testnet.org');
  kit.addAccount(
    'ebc4490663bda8dc3f8082e87f33f4bb3abf628edff93defe42210491d1e5166'
  );
  const [account] = kit.getWallet().getAccounts();
  kit.defaultAccount = account;

  const stableToken = await kit.contracts.getStableToken();
  const goldToken = await kit.contracts.getGoldToken();

  console.log('stableToken.address', stableToken.address);
  console.log('goldToken.address', goldToken.address);

  console.log(await (await stableToken.balanceOf(account)).toFixed());
  console.log(await (await goldToken.balanceOf(account)).toFixed());

  const stable = new kit.web3.eth.Contract(
    ERC20Abi as any,
    stableToken.address
  );
  const gold = new kit.web3.eth.Contract(ERC20Abi as any, goldToken.address);

  console.log(await stable.methods.balanceOf(account).call());
  console.log(await gold.methods.balanceOf(account).call());
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.log(e);
    process.exit(1);
  });
