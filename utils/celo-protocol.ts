import { Address } from '@celo/utils/lib/address';
import Web3 from 'web3';
import { checkFunctionArgsLength } from './deploy-release-celo';

export async function setAndInitializeImplementation(
  web3: Web3,
  proxy: any,
  implementationAddress: string,
  initializerAbi: any,
  txOptions: {
    from?: Address;
    value?: string;
  },
  ...args: any[]
) {
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args);
  if (txOptions.from != null) {
    // The proxied contract needs to be funded prior to initialization
    if (txOptions.value != null) {
      // Proxy's fallback fn expects the contract's implementation to be set already
      // So we set the implementation first, send the funding, and then set and initialize again.
      await proxy._setImplementation(implementationAddress, {
        from: txOptions.from,
      });
      await web3.eth.sendTransaction({
        from: txOptions.from,
        to: proxy.address,
        value: txOptions.value,
      });
    }
    return proxy._setAndInitializeImplementation(
      implementationAddress,
      callData as any,
      { from: txOptions.from }
    );
  } else {
    return proxy._setAndInitializeImplementation(
      implementationAddress,
      callData as any
    );
  }
}

export async function _setInitialProxyImplementation(
  web3: Web3,
  implementation: any,
  proxy: any,
  contractName: string,
  txOptions: {
    from: Address;
    value: string;
  },
  ...args: any[]
) {
  const initializerAbi = (implementation as any).abi.find(
    (abi: any) => abi.type === 'function' && abi.name === 'initialize'
  );

  let receipt: any;
  if (initializerAbi) {
    // TODO(Martin): check types, not just argument number
    checkFunctionArgsLength(args, initializerAbi);
    console.log(`  Setting initial ${contractName} implementation on proxy`);
    receipt = await setAndInitializeImplementation(
      web3,
      proxy,
      implementation.address,
      initializerAbi,
      txOptions,
      ...args
    );
  } else {
    if (txOptions.from != null) {
      receipt = await proxy._setImplementation(implementation.address, {
        from: txOptions.from,
      });
      if (txOptions.value != null) {
        await web3.eth.sendTransaction({
          from: txOptions.from,
          to: proxy.address,
          value: txOptions.value,
        });
      }
    } else {
      receipt = await proxy._setImplementation(implementation.address);
    }
  }
  return receipt.tx;
}
