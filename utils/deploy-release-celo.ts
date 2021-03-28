import { ContractKit } from '@celo/contractkit';
import { Address, isValidAddress } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';
import { differenceInDays, differenceInSeconds } from 'date-fns';
import Web3 from 'web3';

import ReleaseGoldJson from './abis/ReleaseGold.json';
import { _setInitialProxyImplementation } from './celo-protocol';
import { retry } from './web3-utils';

const celoRegistryAddress = '0x000000000000000000000000000000000000ce10';

interface ReleaseGoldConfig {
  releaseStartTime: string;
  releaseCliffTime: number;
  numReleasePeriods: number;
  releasePeriod: number;
  amountReleasedPerPeriod: BigNumber;
  revocable: boolean;
  beneficiary: Address;
  releaseOwner: Address;
  refundAddress: Address;
  subjectToLiquidityProvision: boolean;
  initialDistributionRatio: number;
  canValidate: boolean;
  canVote: boolean;
}

export async function deployReleaseCelo(
  config: {
    start: Date;
    end: Date;
    amount: string;
    to: string;
    from: string;
  },
  kit: ContractKit
) {
  const secondsDiff = Math.abs(differenceInSeconds(config.start, config.end));

  const weiAmount = new BigNumber(Web3.utils.toWei(config.amount));
  const amountPerSecond = weiAmount.div(secondsDiff).dp(0);
  if (amountPerSecond.lt(1)) {
    // we need to change to release 1 wei per period, not 1 wei per second
    throw new Error('Amount to small for distribution period');
  }
  // Reflect any rounding changes from the division above
  const totalValue = amountPerSecond.multipliedBy(secondsDiff);
  console.log('Total Value', totalValue.toString());

  const releaseStartTime = config.start.getTime() / 1000;
  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    0, // releaseCliffTime
    secondsDiff, // numReleasePeriods
    1, // config.releasePeriod,
    amountPerSecond.toFixed(), // adjustedAmountPerPeriod.toFixed(),
    true, // config.revocable,
    config.to, // config.beneficiary,
    config.from, // config.releaseOwner,
    config.from, // config.refundAddress,
    false, // config.subjectToLiquidityProvision,
    1000, // config.initialDistributionRatio,
    false, // config.canValidate,
    false, // config.canVote,
    celoRegistryAddress,
  ];

  // @ts-ignore
  const ReleaseGold = new kit.web3.eth.Contract(ReleaseGoldJson.abi);
  const releaseGoldInstance = await ReleaseGold.deploy({
    data: ReleaseGoldJson.bytecode,
    arguments: [true],
  }).send({
    from: config.from,
  });

  await retry(() =>
    kit.web3.eth.sendTransaction({
      from: config.from,
      // @ts-ignore
      to: releaseGoldInstance._address,
      value: totalValue.toFixed(),
    })
  );

  console.log(
    'Funded with',
    // @ts-ignore
    await kit.web3.eth.getBalance(releaseGoldInstance._address)
  );

  await retry(() =>
    releaseGoldInstance.methods
      .initialize(...contractInitializationArgs)
      .send({ from: config.from })
  );
  console.log('Done');

  // @ts-ignore
  return releaseGoldInstance._address;
}
