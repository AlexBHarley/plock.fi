import { Address, isValidAddress } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';

import ReleaseGoldJson from './abis/ReleaseGold.json';
import { _setInitialProxyImplementation } from './celo-protocol';

const celoRegistryAddress = '0x000000000000000000000000000000000000ce10';

interface ReleaseGoldConfig {
  identifier: string;
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
  web3: Web3,
  config: ReleaseGoldConfig,
  from: string
) {
  const releaseStartTime = new Date(config.releaseStartTime).getTime() / 1000;

  let totalValue = config.amountReleasedPerPeriod.multipliedBy(
    config.numReleasePeriods
  );

  const adjustedAmountPerPeriod = totalValue
    .div(config.numReleasePeriods)
    .dp(0);
  // Reflect any rounding changes from the division above
  totalValue = adjustedAmountPerPeriod.multipliedBy(config.numReleasePeriods);

  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    config.releaseCliffTime,
    config.numReleasePeriods,
    config.releasePeriod,
    adjustedAmountPerPeriod.toFixed(),
    config.revocable,
    config.beneficiary,
    config.releaseOwner,
    config.refundAddress,
    config.subjectToLiquidityProvision,
    config.initialDistributionRatio,
    config.canValidate,
    config.canVote,
    celoRegistryAddress,
  ];

  console.log('Total value', totalValue.toString());
  console.log(
    'Calculated value',
    new BigNumber(config.numReleasePeriods)
      .multipliedBy(adjustedAmountPerPeriod.toFixed())
      .toString()
  );

  const ReleaseGold = new web3.eth.Contract(ReleaseGoldJson.abi);
  console.log('ReleaseGold', ReleaseGold);
  const releaseGoldInstance = await ReleaseGold.deploy({
    data: ReleaseGoldJson.bytecode,
    arguments: [true],
  }).send({
    from,
  });
  console.log('Deployed ReleaseGold instance', releaseGoldInstance);

  console.log(
    'releaseGoldInstance._address',
    releaseGoldInstance._address,
    totalValue.toFixed()
  );
  for (let i = 0; i < 5; i++) {
    try {
      await web3.eth.sendTransaction({
        from,
        to: releaseGoldInstance._address,
        value: totalValue.toFixed(),
      });
      break;
      console.log('Funded');
    } catch (e) {
      console.log(e);
    }
  }

  console.log(
    'Funded with',
    await web3.eth.getBalance(releaseGoldInstance._address)
  );

  for (let i = 0; i < 5; i++) {
    try {
      await releaseGoldInstance.methods
        .initialize(...contractInitializationArgs)
        .send({ from });
      console.log('Done');
      break;
    } catch (e) {
      console.log(e);
    }
  }
}
