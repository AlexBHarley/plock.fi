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
import Link from 'next/link';

const defaultAccountSummary = {
  TotalLiquidity: '0',
  TotalCollateral: '0',
  TotalBorrow: '0',
  TotalFees: '0',
  AvailableBorrow: '0',
  LiquidationThreshold: '0',
  LoanToValue: '0',
  healthFactor: new BigNumber(0),
};

enum States {
  None = 'None',
  Depositing = 'Depositing',
  Borrowing = 'Borrowing',
  Loading = 'Loading',
}

export function Lend() {
  const { network, kit, address, performActions } = useContractKit();
  const { balances } = Base.useContainer();

  const [state, setState] = useState(States.None);
  const [markets, setMarkets] = useState([]);
  const [userReserves, setUserReserves] = useState([]);
  const [accountSummary, setAccountSummary] = useState(defaultAccountSummary);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState(TokenTicker.CELO);
  const [interestRate, setInterestRate] = useState<'stable' | 'variable'>(
    'stable'
  );
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowToken, setBorrowToken] = useState(TokenTicker.CELO);

  const fetchAccountSummary = useCallback(async () => {
    const client = await Aave(kit as any, network.name, address);
    if (address) {
      setAccountSummary(await client.getUserAccountData(address));
    }
  }, []);

  const fetchMarkets = useCallback(async () => {
    setState(States.Loading);
    try {
      const client = await Aave(kit as any, network.name, address);
      const rsvs = await client.getReserves();
      const reserveData = await Promise.all(
        rsvs.map(async (r) => {
          const [token] = (
            await Promise.all(
              tokens
                .filter((t) => !!t.networks[network.name])
                .map(async (t) => {
                  if (
                    (await client.getReserveAddress(
                      t.networks[network.name]
                    )) === r
                  ) {
                    return t;
                  }
                  return null;
                })
            )
          ).filter(Boolean);

          const data = await client.getReserveData(r);
          return {
            ...token,
            ...data,
          };
        })
      );

      setMarkets(reserveData);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  }, [network, kit, address]);

  const withdraw = async () => {
    if (!depositAmount || state === States.Depositing) {
      return;
    }

    const wei = Web3.utils.toWei(depositAmount);
    const token = tokens.find((t) => t.ticker === depositToken);
    if (!token) {
      return;
    }

    try {
      setState(States.Depositing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.withdraw(token.networks[network.name], wei);
      });
      fetchMarkets();
      toast.success(`${depositToken} deposited`);
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
    const token = tokens.find((t) => t.ticker === depositToken);
    if (!token) {
      return;
    }

    try {
      setState(States.Depositing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.deposit(token.networks[network.name], wei);
      });
      fetchMarkets();
      toast.success(`${depositToken} deposited`);
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
    const token = tokens.find((t) => t.ticker === depositToken);
    if (!token) {
      return;
    }

    try {
      setState(States.Borrowing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.borrow(token.networks[network.name], wei, interestRate);
      });
      fetchMarkets();
      toast.success(`${depositToken} deposited`);
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
    const token = tokens.find((t) => t.ticker === depositToken);
    if (!token) {
      return;
    }

    try {
      setState(States.Borrowing);
      await performActions(async (k) => {
        const client = await Aave(k as any, network.name, address);
        await client.repay(token.networks[network.name], wei);
      });
      fetchMarkets();
      toast.success(`${depositToken} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const isSafe = accountSummary.healthFactor.gt(100);

  return (
    <>
      <Panel>
        <PanelHeader>Lend</PanelHeader>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Plock uses{' '}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://moola.market"
          >
            Moola Market
          </a>
          , a decentralised lending platform to facilitate providing liquiditiy
          and borrowing.
        </p>

        <div>
          <dl className="grid grid-cols-1 rounded-lg bg-white overflow-hidden shadow divide-y divide-gray-200 md:grid-cols-3 md:divide-y-0 md:divide-x">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-medium text-gray-600">
                Total Liquidity
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {formatAmount(accountSummary.TotalLiquidity)}
                </div>
              </dd>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-medium text-gray-600">
                Available To Borrow
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {formatAmount(accountSummary.AvailableBorrow)}
                </div>
                {/* <div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 md:mt-2 lg:mt-0">
                  <svg
                    className="-ml-1 mr-0.5 flex-shrink-0 self-center h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="sr-only">Increased by</span>
                  2.02%
                </div> */}
              </dd>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-medium text-gray-600">
                Health Factor
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {isSafe ? 'Safe' : 'Not Safe'}
                </div>
                <div
                  className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                    isSafe
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  } md:mt-2 lg:mt-0`}
                >
                  {isSafe ? (
                    <svg
                      className="-ml-1 mr-0.5 flex-shrink-0 self-center h-5 w-5 text-green-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="-ml-1 mr-0.5 flex-shrink-0 self-center h-5 w-5 text-red-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {accountSummary.healthFactor.toFixed(0)}%
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </Panel>

      <Panel>
        <PanelHeader>Markets</PanelHeader>

        <div className="-mx-5">
          <Table
            headers={[
              '',
              'Ticker',
              'Market Size',
              'Total Borrowed',
              'Deposit APY',
              'Borrow APY (variable)',
              'Borrow APY (stable)',
            ]}
            loading={state === States.Loading}
            noDataMessage={'No reserve data found'}
            rows={markets.map((r) => {
              const Icon = TokenIcons[r.ticker];
              return [
                <div>
                  <Link href={`/lend/${r.ticker}`}>
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-900 transition text-white rounded">
                      Trade
                    </button>
                  </Link>
                </div>,
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4" />
                  <div>{r.ticker}</div>
                </div>,
                <div className="font-semibold">
                  {formatAmount(r.TotalLiquidity)}
                </div>,
                <div className="font-semibold">
                  {formatAmount(
                    new BigNumber(r.TotalBorrowsStable).plus(
                      r.TotalBorrowsVariable
                    )
                  )}
                </div>,
                <div>
                  <span className="text-green-500 mr-1">
                    {r.LiquidityRate.toFixed(2)}
                  </span>
                  %
                </div>,
                <div>
                  <span className="text-blue-500 mr-1">
                    {r.AverageStableRate.toFixed(2)}
                  </span>
                  %
                </div>,
                <div>
                  <span className="text-yellow-600 mr-1">
                    {r.VariableRate.toFixed(2)}
                  </span>
                  %
                </div>,
              ];
            })}
          />
        </div>
      </Panel>
    </>
  );
}
