import { useContractKit } from '@celo-tools/use-contractkit';
import {
  Balances,
  TokenInput,
  Panel,
  PanelDescription,
  PanelGrid,
  PanelHeader,
  PanelWithButton,
  Table,
  toast,
  Toggle,
  TokenIcons,
  WithLayout,
} from '../../components';
import { Celo, cUSD, tokens, TokenTicker } from '../../constants';
import { useCallback, useEffect, useState } from 'react';
import { Aave } from '../../utils/aave';
import { formatAmount } from '../../utils';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import Loader from 'react-loader-spinner';
import { Base } from '../../state';
import {
  buildStyles,
  CircularProgressbarWithChildren,
} from 'react-circular-progressbar';
import { Link, useParams } from 'react-router-dom';

const defaultAccountSummary = {
  Deposited: new BigNumber(0),
  Borrowed: new BigNumber(0),
  Debt: new BigNumber(0),

  BorrowRate: new BigNumber(0),
  LiquidityRate: new BigNumber(0),
  OriginationFee: 'data.originationFee',
  BorrowIndex: 'data.variableBorrowIndex',
  LastUpdate: '',
  IsCollateral: false,
};

const defaultReserve = {
  TotalLiquidity: new BigNumber('0'),
  AvailableLiquidity: new BigNumber('0'),
  TotalBorrowsStable: new BigNumber('0'),
  TotalBorrowsVariable: new BigNumber('0'),
  LiquidityRate: new BigNumber('0'),
  VariableRate: new BigNumber('0'),
  StableRate: new BigNumber('0'),
  AverageStableRate: new BigNumber('0'),
  UtilizationRate: new BigNumber('0'),
  LiquidityIndex: '0',
  VariableBorrowIndex: '0',
  MToken: '0',
  LastUpdate: new Date(
    new BigNumber('0').multipliedBy(1000).toNumber()
  ).toLocaleString(),
};

enum States {
  None = 'None',
  Depositing = 'Depositing',
  Borrowing = 'Borrowing',
  Loading = 'Loading',
}

export function LendToken() {
  const { token: tokenTicker } = useParams();

  const { network, kit, address, performActions } = useContractKit();
  const { balances } = Base.useContainer();

  const [state, setState] = useState(States.None);
  const [accountSummary, setAccountSummary] = useState(defaultAccountSummary);
  const [reserve, setReserve] = useState(defaultReserve);

  const [depositAmount, setDepositAmount] = useState('');
  const [interestRate, setInterestRate] = useState<'stable' | 'variable'>(
    'stable'
  );
  const [borrowAmount, setBorrowAmount] = useState('');

  const token = tokens.find(
    (t) =>
      t.ticker.toLowerCase() === ((tokenTicker as string) || '').toLowerCase()
  );

  const fetchAccountSummary = useCallback(async () => {
    if (!token) {
      return;
    }

    const client = await Aave(kit as any, network.name, address);

    const tokenAddress = token.networks[network.name];
    const reserveAddress = await client.getReserveAddress(
      tokenAddress as string
    );
    const [reserve, accountSummary] = await Promise.all([
      client.getReserveData(reserveAddress),
      client.getUserReserveData(reserveAddress, address),
    ]);

    setReserve(reserve);
    setAccountSummary(accountSummary);
  }, [token, address, kit, network]);

  useEffect(() => {
    fetchAccountSummary();
  }, [fetchAccountSummary]);

  const withdraw = async () => {
    if (!depositAmount || state === States.Depositing) {
      return;
    }

    const wei = Web3.utils.toWei(depositAmount);
    try {
      setState(States.Depositing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.withdraw(token.networks[network.name], wei);
      });
      toast.success(`${token.name} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  const deposit = async () => {
    if (!depositAmount || state === States.Depositing) {
      return;
    }

    const wei = Web3.utils.toWei(depositAmount);

    try {
      setState(States.Depositing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.deposit(token.networks[network.name], wei);
      });
      toast.success(`${token.name} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  const borrow = async () => {
    if (!borrowAmount || state === States.Borrowing) {
      return;
    }

    const wei = Web3.utils.toWei(borrowAmount);
    try {
      setState(States.Borrowing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.borrow(token.networks[network.name], wei, interestRate);
      });
      toast.success(`${token.name} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  const repay = async () => {
    if (!borrowAmount || state === States.Borrowing) {
      return;
    }

    const wei = Web3.utils.toWei(borrowAmount);

    try {
      setState(States.Borrowing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.repay(token.networks[network.name], wei);
      });
      toast.success(`${token.name} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  if (!token) {
    return <Panel>Invalid ticker</Panel>;
  }

  const stableInterestRate = '0'; // reserve?.AverageStableRate?.toFixed(2) ?? '0';
  const variableInterestRate = '0'; // reserve?.VariableRate?.toFixed(2) ?? '0';

  // const deposited =
  const marketSize = reserve.AvailableLiquidity.plus(
    reserve.TotalBorrowsStable
  ).plus(reserve.TotalBorrowsVariable);
  const liquidityPercentage = reserve.AvailableLiquidity.dividedBy(marketSize)
    .times(100)
    .toNumber();
  const Icon = TokenIcons[tokenTicker as string];

  return (
    <>
      <div>
        <Link href="/lend">
          <div className="flex items-center space-x-1 cursor-pointer">
            <svg
              className="h-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm">Back to markets</span>
          </div>
        </Link>
      </div>

      <Panel>
        <PanelHeader>{token.ticker} Market Overview</PanelHeader>

        <div className="flex flex-row items-center sm:px-20 space-x-12">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-600 whitespace-nowrap">
                Borrowed
              </div>
              <div className="text-xl font-medium">
                {formatAmount(
                  reserve.TotalBorrowsStable.plus(reserve.TotalBorrowsVariable)
                )}{' '}
                <span className="text-base">{token.ticker}</span>
              </div>
              <div className="text-xs text-gray-600 whitespace-nowrap">
                <div>
                  {formatAmount(reserve.AverageStableRate)}% stable borrow APY{' '}
                </div>
                <div>
                  {formatAmount(reserve.VariableRate)}% variable borrow APY{' '}
                </div>{' '}
              </div>
            </div>
          </div>

          <div className="w-96">
            <CircularProgressbarWithChildren
              strokeWidth={5}
              value={liquidityPercentage}
              styles={buildStyles({
                trailColor: 'red',
                pathColor: 'green',
              })}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="mb-4">
                  <Icon height="40px" width="40px" />
                </span>
              </div>
            </CircularProgressbarWithChildren>
          </div>

          <div>
            <div className="text-xs text-gray-600 whitespace-nowrap">
              Available Liquidity
            </div>
            <div className="text-xl font-medium">
              {formatAmount(reserve.AvailableLiquidity)}{' '}
              <span className="text-base">{token.ticker}</span>
            </div>
            <div className="text-xs text-gray-600 whitespace-nowrap">
              {formatAmount(reserve.LiquidityRate)}% deposit APY
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Your position
          </h3>
          <dl className="mt-5 grid grid-cols-1 rounded-lg bg-white overflow-hidden shadow divide-y divide-gray-200 md:grid-cols-3 md:divide-y-0 md:divide-x">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-gray-900">
                Total Deposited
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {formatAmount(accountSummary.Deposited)}
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    {formatAmount(accountSummary.LiquidityRate)}%
                  </span>
                </div>
              </dd>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-gray-900">
                Total Borrowed
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {formatAmount(accountSummary.Borrowed)}

                  <span className="ml-2 text-sm font-medium text-gray-500">
                    {formatAmount(accountSummary.BorrowRate)}%
                  </span>
                </div>
              </dd>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-gray-900">
                Avg. Click Rate
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  24.57%
                  <span className="ml-2 text-sm font-medium text-gray-500">
                    from 28.62%
                  </span>
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </Panel>

      <Panel>
        <PanelHeader>Trade</PanelHeader>

        <PanelGrid>
          <div>
            <h3 className="font-medium leading-6 text-gray-900 dark:text-gray-200">
              Deposit
            </h3>
            <PanelDescription>
              Deposit funds to provide liquidity and collatoral to the market.
            </PanelDescription>
          </div>
          <div className="space-y-3">
            <TokenInput
              value={depositAmount}
              onChange={(e) => setDepositAmount(e)}
              max={balances[token.ticker].toString()}
              token={token}
            />
            <div className="flex justify-around items-center">
              <button
                className="secondary-button"
                onClick={withdraw}
                disabled={state === States.Depositing}
              >
                {state === States.Depositing ? (
                  <Loader
                    type="TailSpin"
                    height={24}
                    width={24}
                    color="white"
                  />
                ) : (
                  'Withdraw'
                )}
              </button>

              <button
                className="secondary-button"
                onClick={deposit}
                disabled={state === States.Depositing}
              >
                {state === States.Depositing ? (
                  <Loader
                    type="TailSpin"
                    height={24}
                    width={24}
                    color="white"
                  />
                ) : (
                  'Deposit'
                )}
              </button>
            </div>
          </div>
        </PanelGrid>

        <PanelGrid>
          <div>
            <h3 className="font-medium leading-6 text-gray-900 dark:text-gray-200">
              Borrow
            </h3>
            <PanelDescription>
              By borrowing you are able to obtain liquidity (working capital)
              without selling your assets.
            </PanelDescription>
          </div>
          <div className="">
            <div className="space-y-4">
              <TokenInput
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e)}
                max={balances[token.ticker].toString()}
                token={token}
              />
              <div className="md:flex md:items-center md:justify-between">
                <div className="text-gray-500">Interest Rate</div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div>Stable ({formatAmount(reserve.AverageStableRate)}%)</div>
                  <Toggle
                    active={interestRate === 'stable'}
                    onChange={(bool) =>
                      setInterestRate(bool ? 'stable' : 'variable')
                    }
                  />
                  <div>Variable ({formatAmount(reserve.VariableRate)}%)</div>
                </div>
              </div>
              <div className="flex justify-around items-center">
                <button
                  className="secondary-button"
                  onClick={repay}
                  disabled={state === States.Borrowing}
                >
                  {state === States.Borrowing ? (
                    <Loader
                      type="TailSpin"
                      height={24}
                      width={24}
                      color="white"
                    />
                  ) : (
                    'Repay'
                  )}
                </button>

                <button
                  className="secondary-button"
                  onClick={borrow}
                  disabled={state === States.Borrowing}
                >
                  {state === States.Borrowing ? (
                    <Loader
                      type="TailSpin"
                      height={24}
                      width={24}
                      color="white"
                    />
                  ) : (
                    'Borrow'
                  )}
                </button>
              </div>
            </div>
          </div>
        </PanelGrid>
      </Panel>
    </>
  );
}
