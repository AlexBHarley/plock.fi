import { Address } from '@celo/utils/lib/address';
import Web3 from 'web3';
import { checkFunctionArgsLength } from './deploy-release-celo-bak';
import { retryTx } from './web3-utils';

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
  console.log('setAndInitializeImplementation', args);
  const callData = web3.eth.abi.encodeFunctionCall(initializerAbi, args);
  console.log('>>> calldata', callData);
  if (txOptions.from != null) {
    // The proxied contract needs to be funded prior to initialization
    if (txOptions.value != null) {
      // Proxy's fallback fn expects the contract's implementation to be set already
      // So we set the implementation first, send the funding, and then set and initialize again.

      console.log('Setting', implementationAddress);
      await proxy.methods._setImplementation(implementationAddress).send({
        from: txOptions.from,
      });

      await retryTx(web3.eth.sendTransaction, [
        {
          from: txOptions.from,
          to: proxy._address,
          value: txOptions.value,
        },
      ]);
      console.log('Sent');
    }

    for (let i = 0; i < 10; i++) {
      try {
        const a = await proxy.methods
          ._setAndInitializeImplementation(
            implementationAddress,
            callData as any
          )
          .send({ from: txOptions.from, gas: 3000000 });
        console.log('Worked!');
        return a;
      } catch (e) {
        console.log(e);
      }
    }
    throw new Error('Didnt work');
  } else {
    return proxy
      ._setAndInitializeImplementation(implementationAddress, callData as any)
      .send();
  }
}

export async function _setInitialProxyImplementation(
  web3: Web3,
  instance: { address: string; abi: any[] },
  proxy: any,
  contractName: string,
  txOptions: {
    from: Address;
    value: string;
  },
  ...args: any[]
) {
  const initializerAbi = instance.abi.find(
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
      instance.address,
      initializerAbi,
      txOptions,
      ...args
    );
  } else {
    console.log('+++++ GHEERERE+++++');
    if (txOptions.from != null) {
      receipt = await proxy._setImplementation(instance.address, {
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
      receipt = await proxy._setImplementation(instance.address);
    }
  }
  return receipt.tx;
}
