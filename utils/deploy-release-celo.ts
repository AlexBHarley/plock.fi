import { Address, NULL_ADDRESS } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';

import ReleaseGoldJson from './abis/ReleaseGold.json';
import ReleaseGoldProxyJson from './abis/ReleaseGoldProxy.json';
import { _setInitialProxyImplementation } from './celo-protocol';

import Web3 from 'web3';
import { ContractKit } from '@celo/contractkit';

const celoRegistryAddress = '0x000000000000000000000000000000000000ce10';

export interface ReleaseGoldConfig {
  identifier: string;
  releaseStartTime: Date;
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

const startGold = Web3.utils.toWei('1', 'ether');

type ReleaseGoldTemplate = Partial<ReleaseGoldConfig>;

export async function deployReleaseCelo(
  kit: ContractKit,
  config: ReleaseGoldConfig,
  fromAddress: Address
) {
  // Sentinel MAINNET dictates a start time of mainnet launch, April 22 2020 16:00 UTC in this case
  const releaseStartTime = new Date(config.releaseStartTime).getTime() / 1000;

  console.log(config);
  let totalValue = config.amountReleasedPerPeriod.multipliedBy(
    config.numReleasePeriods
  );

  let adjustedAmountPerPeriod = totalValue.div(config.numReleasePeriods).dp(0);
  const celo = await kit.contracts.getGoldToken();
  if ((await celo.balanceOf(config.beneficiary)).lt(1)) {
    adjustedAmountPerPeriod = totalValue
      .minus(startGold)
      .div(config.numReleasePeriods)
      .dp(0);
  }

  const fromBalance = await await celo.balanceOf(fromAddress);
  if (fromBalance.lt(totalValue)) {
    throw new Error('Not enough funds');
  }

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

  console.log(contractInitializationArgs);
  const ReleaseGold = new kit.web3.eth.Contract(ReleaseGoldJson.abi);

  const initializerAbiRG = checkAndReturnInitializationAbi(
    ReleaseGoldJson,
    'ReleaseGold'
  );

  const releaseGoldInstance = await ReleaseGold.deploy({
    data: ReleaseGoldJson.bytecode,
  }).send({
    from: fromAddress,
  });
  console.log('Deployed gold instance', releaseGoldInstance._address);

  console.info('Initializing ReleaseGold...');
  await initializeRGImplementation(
    kit.web3,
    releaseGoldInstance,
    fromAddress,
    initializerAbiRG,
    contractInitializationArgs
  );

  // Send starting gold amount to the beneficiary so they can perform transactions.
  console.info('  Sending beneficiary starting gold...');
  await kit.web3.eth.sendTransaction({
    from: fromAddress,
    to: config.beneficiary,
    value: startGold,
  });
}

async function initializeRGImplementation(
  web3: Web3,
  releaseGoldInstance: any,
  from: string,
  initializerAbiRG: string,
  initialisationArgs: any[]
) {
  // We need to fund the RG implementation instance in order to initialize it.
  console.info(
    `Funding ReleaseGold implementation (${releaseGoldInstance._address}) so it can be initialized...`
  );
  await web3.eth.sendTransaction({
    from,
    to: releaseGoldInstance._address,
    value: 1000,
  });
  console.log('ReleaseGold funded');

  checkFunctionArgsLength(initialisationArgs, initializerAbiRG);

  const implInitCallData = web3.eth.abi.encodeFunctionCall(
    initializerAbiRG,
    initialisationArgs
  );

  console.info('Sending initialize tx...', implInitCallData);
  await web3.eth.sendTransaction({
    from,
    to: releaseGoldInstance._address,
    data: implInitCallData,
    gas: 300000,
  });
  console.info('Returned from initialization tx');

  if (!(await (releaseGoldInstance as any).initialized())) {
    console.error(
      `Failed to initialize ReleaseGold implementation at address ${releaseGoldInstance._address}`
    );
  }
  console.info('ReleaseGold implementation has been successfully initialized!');
}

function checkAndReturnInitializationAbi(Contract: any, name: string) {
  const initializerAbi: string = Contract.abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'initialize'
  );
  if (!initializerAbi) {
    throw new Error(
      `Attempting to deploy implementation contract ${name} that does not have an initialize() function. Abort.`
    );
  }
  return initializerAbi;
}

export function checkFunctionArgsLength(args: any[], abi: any) {
  if (args.length !== abi.inputs.length) {
    throw new Error(
      `Incorrect number of arguments to Solidity function: ${abi.name}`
    );
  }
}
