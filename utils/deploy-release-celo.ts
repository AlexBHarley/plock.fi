import { Address, NULL_ADDRESS } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';

import ReleaseGoldJson from './abis/ReleaseGold.json';
import ReleaseGoldProxyJson from './abis/ReleaseGoldProxy.json';
import { _setInitialProxyImplementation } from './celo-protocol';

import Web3 from 'web3';

const celoRegistryAddress = '0x000000000000000000000000000000000000ce10';

export interface ReleaseGoldConfig {
  identifier: string;
  releaseStartTime: string;
  releaseCliffTime: number;
  numReleasePeriods: number;
  releasePeriod: number;
  amountReleasedPerPeriod: number;
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
  web3: Web3,
  config: ReleaseGoldConfig,
  fromAddress: Address
) {
  // Sentinel MAINNET dictates a start time of mainnet launch, April 22 2020 16:00 UTC in this case
  const releaseStartTime = new Date(config.releaseStartTime).getTime() / 1000;

  const weiAmountReleasedPerPeriod = new BigNumber(
    web3.utils.toWei(config.amountReleasedPerPeriod.toString())
  );

  let totalValue = weiAmountReleasedPerPeriod.multipliedBy(
    config.numReleasePeriods
  );

  const adjustedAmountPerPeriod = totalValue
    .minus(startGold)
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

  const ReleaseGoldProxy = new web3.eth.Contract(ReleaseGoldProxyJson.abi);
  const ReleaseGold = new web3.eth.Contract(ReleaseGoldJson.abi);

  const initializerAbiRG = checkAndReturnInitializationAbi(
    ReleaseGold,
    'ReleaseGold'
  );
  const transferImplOwnershipAbiRG = checkAndReturnTransferOwnershipAbi(
    ReleaseGold,
    'ReleaseGold'
  );
  console.info('  Deploying ReleaseGoldProxy...');
  const releaseGoldProxy = await ReleaseGoldProxy.deploy({
    data: ReleaseGoldProxyJson.bytecode,
  }).send({
    from: fromAddress,
  });

  const releaseGoldInstance = await ReleaseGold.deploy({
    data: ReleaseGoldJson.bytecode,
  }).send({
    from: fromAddress,
  });

  console.info('Initializing ReleaseGold...');
  await initializeRGImplementation(
    web3,
    releaseGoldInstance,
    fromAddress,
    initializerAbiRG,
    transferImplOwnershipAbiRG
  );

  console.info('Initializing ReleaseGoldProxy...');
  let releaseGoldTxHash;
  try {
    releaseGoldTxHash = await _setInitialProxyImplementation(
      web3,
      releaseGoldInstance,
      releaseGoldProxy,
      'ReleaseGold',
      {
        from: fromAddress,
        value: totalValue.toFixed(),
      },
      ...contractInitializationArgs
    );
  } catch (e) {
    console.info(
      'Something went wrong! Consider using the recover-funds.ts script with the below address'
    );
    console.info('ReleaseGoldProxy', releaseGoldProxy.address);
    throw e;
  }
  const proxiedReleaseGold = await ReleaseGold.at(releaseGoldProxy.address);
  await proxiedReleaseGold.transferOwnership(releaseGoldMultiSigProxy.address, {
    from: fromAddress,
  });
  await releaseGoldProxy._transferOwnership(releaseGoldMultiSigProxy.address, {
    from: fromAddress,
  });

  // Send starting gold amount to the beneficiary so they can perform transactions.
  console.info('  Sending beneficiary starting gold...');
  await web3.eth.sendTransaction({
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
  transferImplOwnershipAbiRG: string
) {
  // We need to fund the RG implementation instance in order to initialize it.
  console.info(
    'Funding ReleaseGold implementation so it can be initialized...'
  );
  await web3.eth.sendTransaction({
    from,
    to: releaseGoldInstance.address,
    value: 1,
  });
  // Initialize and lock ownership of RG implementation
  const implementationInitArgs = [
    Math.round(new Date().getTime() / 1000),
    0,
    1,
    1,
    1,
    false, // should not be revokable
    '0x0000000000000000000000000000000000000001',
    NULL_ADDRESS,
    NULL_ADDRESS,
    true, // subjectToLiquidityProivision
    0,
    false, // canValidate
    false, // canVote
    '0x0000000000000000000000000000000000000001',
  ];
  const implementationTransferOwnershipArgs = [
    '0x0000000000000000000000000000000000000001',
  ];
  checkFunctionArgsLength(implementationInitArgs, initializerAbiRG);
  checkFunctionArgsLength(
    implementationTransferOwnershipArgs,
    transferImplOwnershipAbiRG
  );
  const implInitCallData = web3.eth.abi.encodeFunctionCall(
    // @ts-ignore
    initializerAbiRG,
    implementationInitArgs
  );
  const transferImplOwnershipCallData = web3.eth.abi.encodeFunctionCall(
    // @ts-ignore
    transferImplOwnershipAbiRG,
    implementationTransferOwnershipArgs
  );
  console.info('Sending initialize tx...');
  await web3.eth.sendTransaction({
    from,
    to: releaseGoldInstance.address,
    data: implInitCallData,
    gas: 3000000,
  });
  console.info('Returned from initialization tx');
  if (!(await (releaseGoldInstance as any).initialized())) {
    console.error(
      `Failed to initialize ReleaseGold implementation at address ${releaseGoldInstance.address}`
    );
  }
  console.info('ReleaseGold implementation has been successfully initialized!');

  console.info(
    'Transferring ownsership of ReleaseGold implementation to 0x0000000000000000000000000000000000000001'
  );
  await web3.eth.sendTransaction({
    from,
    to: releaseGoldInstance.address,
    data: transferImplOwnershipCallData,
  });
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

function checkAndReturnTransferOwnershipAbi(Contract: any, name: string) {
  const transferImplOwnershipAbi: string = Contract.abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'transferOwnership'
  );
  if (!transferImplOwnershipAbi) {
    throw new Error(
      `Attempting to deploy implementation contract ${name} that does not have a _transferOwnership() function. Abort.`
    );
  }
  return transferImplOwnershipAbi;
}

export function checkFunctionArgsLength(args: any[], abi: any) {
  if (args.length !== abi.inputs.length) {
    throw new Error(
      `Incorrect number of arguments to Solidity function: ${abi.name}`
    );
  }
}
