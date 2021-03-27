import { Address, NULL_ADDRESS } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';

import ReleaseGoldJson from './abis/ReleaseGold.json';
import ReleaseGoldProxyJson from './abis/ReleaseGoldProxy.json';
import { _setInitialProxyImplementation } from './celo-protocol';

import Web3 from 'web3';
import { ContractKit } from '@celo/contractkit';
import { retryTx } from './web3-utils';

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
  totalValue = new BigNumber(adjustedAmountPerPeriod).multipliedBy(
    config.numReleasePeriods
  );

  console.log('totalValue', totalValue.toString());
  console.log('totalValue', totalValue.toFixed());

  const contractInitializationArgs = [
    Math.round(releaseStartTime),
    config.releaseCliffTime,
    config.numReleasePeriods,
    config.releasePeriod,
    adjustedAmountPerPeriod.toNumber(),
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
  const ReleaseGoldProxy = new kit.web3.eth.Contract(ReleaseGoldProxyJson.abi);

  const initializerAbiRG = checkAndReturnInitializationAbi(
    ReleaseGoldJson,
    'ReleaseGold'
  );
  const transferImplOwnershipAbiRG = checkAndReturnTransferOwnershipAbi(
    ReleaseGoldJson,
    'ReleaseGold'
  );

  const releaseGoldInstance = await ReleaseGold.deploy({
    data: ReleaseGoldJson.bytecode,
    arguments: [true],
  }).send({
    from: fromAddress,
  });
  console.log('Deployed ReleaseGold instance', releaseGoldInstance);

  const releaseGoldProxy = await ReleaseGoldProxy.deploy({
    data: ReleaseGoldProxyJson.bytecode,
  }).send({
    from: fromAddress,
  });

  console.log(
    'Trying to fund',
    releaseGoldInstance._address,
    'with',
    totalValue.toFixed()
  );
  await retryTx(kit.web3.eth.sendTransaction, [
    {
      from: fromAddress,
      to: releaseGoldInstance._address,
      value: totalValue.toFixed(),
    },
  ]);
  console.log(
    '>>>',
    await kit.web3.eth.getBalance(releaseGoldInstance._address)
  );

  console.log('Funded');
  for (let i = 0; i < 5; i++) {
    try {
      await releaseGoldInstance.methods
        .initialize(...contractInitializationArgs)
        .send({ from: fromAddress });
      // { from: fromAddress },
      break;
    } catch (e) {
      console.log(e);
    }
  }
  console.log('Done');

  console.log('Deployed ReleaseGoldProxy', releaseGoldProxy);

  console.info('Initializing ReleaseGold...');
  await initializeRGImplementation(
    kit.web3,
    releaseGoldInstance,
    fromAddress,
    initializerAbiRG,
    transferImplOwnershipAbiRG
  );
  console.info('Initialized ReleaseGold');

  console.info('Initializing ReleaseGoldProxy...');
  let releaseGoldTxHash;
  try {
    releaseGoldTxHash = await _setInitialProxyImplementation(
      kit.web3,
      {
        address: releaseGoldInstance._address,
        abi: releaseGoldInstance._jsonInterface,
      },
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
    console.info('ReleaseGoldProxy', releaseGoldProxy._address);
    throw e;
  }

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
  transferImplOwnershipAbiRG: string
) {
  // We need to fund the RG implementation instance in order to initialize it.
  console.info(
    'Funding ReleaseGold implementation so it can be initialized...'
  );
  await retryTx(web3.eth.sendTransaction, [
    {
      from,
      to: releaseGoldInstance._address,
      value: 1,
    },
  ]);
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
    false, // subjectToLiquidityProivision
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
    initializerAbiRG,
    implementationInitArgs
  );
  const transferImplOwnershipCallData = web3.eth.abi.encodeFunctionCall(
    transferImplOwnershipAbiRG,
    implementationTransferOwnershipArgs
  );
  console.info('Sending initialize tx...');
  await retryTx(web3.eth.sendTransaction, [
    {
      from,
      to: releaseGoldInstance._address,
      data: implInitCallData,
      gas: 3000000,
    },
  ]);
  console.info('Returned from initialization tx');
  console.log(releaseGoldInstance);
  if (!(await (releaseGoldInstance as any).methods.initialized.call())) {
    console.error(
      `Failed to initialize ReleaseGold implementation at address ${releaseGoldInstance.address}`
    );
  }
  console.info('ReleaseGold implementation has been successfully initialized!');

  console.info(
    'Transferring ownsership of ReleaseGold implementation to 0x0000000000000000000000000000000000000001'
  );
  await retryTx(web3.eth.sendTransaction, [
    {
      from,
      to: releaseGoldInstance._address,
      data: transferImplOwnershipCallData,
    },
  ]);
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
