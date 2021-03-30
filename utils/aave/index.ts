import { NetworkNames } from '@celo-tools/use-contractkit';
import { ContractKit } from '@celo/contractkit';
import { Address } from 'node:cluster';
import { AbiItem } from 'web3-utils';

import LendingPoolAddressesProvider from '../abis/aave/LendingPoolAddressesProvider.json';
import LendingPool from '../abis/aave/LendingPool.json';
import LendingPoolCore from '../abis/aave/LendingPoolCore.json';
import LendingPoolDataProvider from '../abis/aave/LendingPoolDataProvider.json';
import ERC20 from '../abis/ERC20.json';
import BigNumber from 'bignumber.js';
import { eqAddress } from '@celo/utils/lib/address';

import { addresses } from './constants';

const ray = '1000000000000000000000000000';

function fromRay(n: string) {
  return new BigNumber(n).dividedBy(ray).multipliedBy(100);
}

export async function Aave(kit: ContractKit, network: NetworkNames) {
  const addressProvider = new kit.web3.eth.Contract(
    LendingPoolAddressesProvider as AbiItem[],
    addresses[network].lendingPoolAddresses
  );

  const lendingPool = new kit.web3.eth.Contract(
    LendingPool as AbiItem[],
    await addressProvider.methods.getLendingPool().call()
  );

  const reserves = await lendingPool.methods.getReserves().call();
  for (const addr of reserves) {
    console.table(await lendingPool.methods.getReserveData(addr).call());
  }

  const lendingPoolCore = new kit.web3.eth.Contract(
    LendingPoolCore as AbiItem[],
    await addressProvider.methods.getLendingPoolCore().call()
  );
  const lendingPoolDataProvider = new kit.web3.eth.Contract(
    LendingPoolDataProvider as AbiItem[],
    await addressProvider.methods.getLendingPoolDataProvider().call()
  );

  async function getReserveData(address: Address) {
    const data = await lendingPool.methods.getReserveData(address).call();
    console.log(data.liquidityRate, fromRay(data.liquidityRate).toFixed(2));
    const parsedData = {
      TotalLiquidity: new BigNumber(data.totalLiquidity),
      AvailableLiquidity: new BigNumber(data.availableLiquidity),
      TotalBorrowsStable: new BigNumber(data.totalBorrowsStable),
      TotalBorrowsVariable: new BigNumber(data.totalBorrowsVariable),
      LiquidityRate: fromRay(data.liquidityRate),
      VariableRate: fromRay(data.variableBorrowRate),
      StableRate: fromRay(data.stableBorrowRate),
      AverageStableRate: fromRay(data.averageStableBorrowRate),
      UtilizationRate: fromRay(data.utilizationRate), // Ut
      LiquidityIndex: data.liquidityIndex,
      VariableBorrowIndex: data.variableBorrowIndex,
      MToken: data.aTokenAddress,
      LastUpdate: new Date(
        new BigNumber(data.lastUpdateTimestamp).multipliedBy(1000).toNumber()
      ).toLocaleString(),
    };

    return parsedData;
  }

  const INTEREST_RATE = {
    NONE: 0,
    STABLE: 1,
    VARIABLE: 2,
    1: 'STABLE',
    2: 'VARIABLE',
    0: 'NONE',
  };

  async function getUserReserveData(reserve: string, user: string) {
    const data = await lendingPool.methods
      .getUserReserveData(reserve, user)
      .call();
    const parsedData = {
      Deposited: data.currentATokenBalance,
      Borrowed: data.principalBorrowBalance,
      Debt: data.currentBorrowBalance,
      RateMode: INTEREST_RATE[data.borrowRateMode],
      BorrowRate: fromRay(data.borrowRate),
      LiquidityRate: fromRay(data.liquidityRate),
      OriginationFee: data.originationFee,
      BorrowIndex: data.variableBorrowIndex,
      LastUpdate: new Date(
        new BigNumber(data.lastUpdateTimestamp).multipliedBy(1000).toNumber()
      ).toLocaleString(),
      IsCollateral: data.usageAsCollateralEnabled,
    };
    return parsedData;
  }

  async function getUserAccountData(user: string) {
    let data;
    try {
      data = await lendingPool.methods.getUserAccountData(user).call();
      console.log(data);
      data = await lendingPoolDataProvider.methods
        .calculateUserGlobalData(user)
        .call();
      console.log(data);
      data.availableBorrowsETH = 0;
    } catch (err) {}

    const parsedData = {
      TotalLiquidity: data.totalLiquidityETH || data.totalLiquidityBalanceETH,
      TotalCollateral:
        data.totalCollateralETH || data.totalCollateralBalanceETH,
      TotalBorrow: data.totalBorrowsETH || data.totalBorrowBalanceETH,
      TotalFees: data.totalFeesETH,
      AvailableBorrow: data.availableBorrowsETH,
      LiquidationThreshold: `${data.currentLiquidationThreshold}%`,
      LoanToValue: `${data.ltv || data.currentLtv}%`,
      healthFactor: data.healthFactor.length > 30 ? 'SAFE' : data.healthFactor,
    };

    return parsedData;
  }

  const isNative = async (tokenAddress: string) => {
    return eqAddress(
      tokenAddress,
      (await kit.contracts.getGoldToken()).address
    );
  };

  const getReserveAddress = async (tokenAddress: string) => {
    if (await isNative(tokenAddress)) {
      return '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    }
    return tokenAddress;
  };

  async function deposit(tokenAddress: string, amount: string) {
    let native = false;
    let reserve = tokenAddress;
    if (await isNative(tokenAddress)) {
      native = true;
      reserve = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
    }

    const erc20 = new kit.web3.eth.Contract(ERC20 as AbiItem[], reserve);
    if (!native) {
      await erc20.methods
        .approve(lendingPoolCore.options.address, amount)
        .send({ from: kit.defaultAccount, gas: 2000000 });
    }
    await lendingPool.methods.deposit(reserve, amount, 0).send({
      from: kit.defaultAccount,
      gas: 2000000,
      value: native ? amount : undefined,
    });
  }

  async function borrow(
    reserve: string,
    amount: string,
    interestRate: 'stable' | 'variable'
  ) {
    const rate = INTEREST_RATE[interestRate.toUpperCase()];
    await lendingPool.methods
      .borrow(reserve, amount, rate, 0)
      .send({ from: kit.defaultAccount, gas: 2000000 });
  }

  return {
    getReserveData,
    getUserReserveData,
    getUserAccountData,

    deposit,
    borrow,

    getReserveAddress,

    getReserves: () => {
      return lendingPool.methods.getReserves().call();
    },
  };
}
