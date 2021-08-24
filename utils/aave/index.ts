import { ContractKit } from '@celo/contractkit';
import { eqAddress } from '@celo/utils/lib/address';
import BigNumber from 'bignumber.js';
import { AbiItem } from 'web3-utils';
import AToken from '../abis/aave/AToken.json';
import LendingPool from '../abis/aave/LendingPool.json';
import LendingPoolAddressesProvider from '../abis/aave/LendingPoolAddressesProvider.json';
import LendingPoolCore from '../abis/aave/LendingPoolCore.json';
import LendingPoolDataProvider from '../abis/aave/LendingPoolDataProvider.json';
import ERC20 from '../abis/ERC20.json';
import { addresses } from './constants';

const ray = '1000000000000000000000000000';
const ether = '1000000000000000000';

function fromRay(n: string) {
  return new BigNumber(n).dividedBy(ray).multipliedBy(100);
}
function fromEth(n: string) {
  return new BigNumber(n).dividedBy(ether);
}

export async function Aave(kit: ContractKit, network: string, from: string) {
  const addressProvider = new kit.web3.eth.Contract(
    LendingPoolAddressesProvider as AbiItem[],
    addresses[network].lendingPoolAddresses
  );

  const [
    lendingPoolAddress,
    lendingPoolCoreAddress,
    lendingPoolDataProviderAddress,
  ] = await Promise.all([
    addressProvider.methods.getLendingPool().call(),
    addressProvider.methods.getLendingPoolCore().call(),
    addressProvider.methods.getLendingPoolDataProvider().call(),
  ]);

  const lendingPool = new kit.web3.eth.Contract(
    LendingPool as AbiItem[],
    lendingPoolAddress
  );

  const lendingPoolCore = new kit.web3.eth.Contract(
    LendingPoolCore as AbiItem[],
    lendingPoolCoreAddress
  );
  const lendingPoolDataProvider = new kit.web3.eth.Contract(
    LendingPoolDataProvider as AbiItem[],
    lendingPoolDataProviderAddress
  );

  async function getReserveData(address: string) {
    const data = await lendingPool.methods.getReserveData(address).call();

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
      Deposited: new BigNumber(data.currentATokenBalance),
      Borrowed: new BigNumber(data.principalBorrowBalance),
      Debt: new BigNumber(data.currentBorrowBalance),
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
    } catch (err) {
      data = await lendingPoolDataProvider.methods
        .calculateUserGlobalData(user)
        .call();
      data.availableBorrowsETH = 0;
    }

    const parsedData = {
      TotalLiquidity: data.totalLiquidityETH || data.totalLiquidityBalanceETH,
      TotalCollateral:
        data.totalCollateralETH || data.totalCollateralBalanceETH,
      TotalBorrow: data.totalBorrowsETH || data.totalBorrowBalanceETH,
      TotalFees: data.totalFeesETH,
      AvailableBorrow: data.availableBorrowsETH,
      LiquidationThreshold: `${data.currentLiquidationThreshold}%`,
      LoanToValue: `${data.ltv || data.currentLtv}%`,
      healthFactor: fromEth(data.healthFactor),
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
        .send({ from, gas: 2000000 });
    }
    await lendingPool.methods.deposit(reserve, amount, 0).send({
      from,
      gas: 2000000,
      value: native ? amount : undefined,
    });
  }

  async function withdraw(tokenAddress: string, amount: string) {
    const reserve = await getReserveAddress(tokenAddress);
    const mtoken = new kit.web3.eth.Contract(
      AToken as any,
      (await lendingPool.methods.getReserveData(reserve).call()).aTokenAddress
    );

    await mtoken.methods
      .redeem(amount)
      .send({ from: kit.defaultAccount, gas: 2000000 });
  }

  async function repay(tokenAddress: string, amount: string) {
    const reserve = await getReserveAddress(tokenAddress);

    let native = false;
    let value = '0';
    if (await isNative(tokenAddress)) {
      native = true;
      const reserveData = await lendingPool.methods
        .getUserReserveData(reserve, kit.defaultAccount)
        .call();
      value = new BigNumber(reserveData.currentBorrowBalance)
        .multipliedBy('1.001')
        .plus(reserveData.originationFee)
        .toFixed(0);
    }

    if (!native) {
      const erc20 = new kit.web3.eth.Contract(ERC20 as AbiItem[], reserve);

      await erc20.methods
        .approve(lendingPoolCore.options.address, amount)
        .send({ from: kit.defaultAccount, gas: 2000000 });
    }

    await lendingPool.methods
      .repay(reserve, amount, kit.defaultAccount)
      .send({ from: kit.defaultAccount, gas: 2000000, value });
  }

  async function borrow(
    reserve: string,
    amount: string,
    interestRate: 'stable' | 'variable'
  ) {
    const rate = INTEREST_RATE[interestRate.toUpperCase()];
    await lendingPool.methods
      .borrow(reserve, amount, rate, 0)
      .send({ from, gas: 2000000 });
  }

  return {
    getReserveData,
    getUserReserveData,
    getUserAccountData,

    deposit,
    borrow,
    withdraw,
    repay,

    getReserveAddress,

    getReserves: () => {
      return lendingPool.methods.getReserves().call();
    },
  };
}
