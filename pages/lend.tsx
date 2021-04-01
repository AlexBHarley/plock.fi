import { useContractKit } from '@celo-tools/use-contractkit';
import {
  Balances,
  InputWithToken,
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
} from 'components';
import { Celo, cUSD, tokens, TokenTicker } from '../constants';
import { useCallback, useEffect, useState } from 'react';
import { Aave } from '../utils/aave';
import { formatAmount } from 'utils';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import Loader from 'react-loader-spinner';

const defaultAccountSummary = {
  TotalLiquidity: '0',
  TotalCollateral: '0',
  TotalBorrow: '0',
  TotalFees: '0',
  AvailableBorrow: '0',
  LiquidationThreshold: '0',
  LoanToValue: '0',
  healthFactor: '0',
};

enum States {
  None = 'None',
  Depositing = 'Depositing',
  Borrowing = 'Borrowing',
  Loading = 'Loading',
}

function Lend() {
  const { network, kit, address, performActions } = useContractKit();

  const [state, setState] = useState(States.None);
  const [reserves, setReserves] = useState([]);
  const [accountSummary, setAccountSummary] = useState(defaultAccountSummary);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositToken, setDepositToken] = useState(TokenTicker.CELO);
  const [interestRate, setInterestRate] = useState<'stable' | 'variable'>(
    'stable'
  );
  const [borrowAmount, setBorrowAmount] = useState('');
  const [borrowToken, setBorrowToken] = useState(TokenTicker.CELO);

  const fetchAccountSummary = useCallback(async () => {
    setState(States.Loading);
    try {
      const client = await Aave(kit as any, network.name, address);
      if (address) {
        console.log(await client.getUserAccountData(address));
        setAccountSummary(await client.getUserAccountData(address));
      }

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

      setReserves(reserveData);
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
      fetchAccountSummary();
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
      fetchAccountSummary();
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
      fetchAccountSummary();
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
      fetchAccountSummary();
      toast.success(`${depositToken} deposited`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  useEffect(() => {
    fetchAccountSummary();
  }, [fetchAccountSummary]);

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
              <dt className="text-base font-normal text-gray-900">
                Total Liquidity
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {formatAmount(accountSummary.TotalLiquidity)}
                  {/* <span className="ml-2 text-sm font-medium text-gray-500">
                      from 70,946
                    </span> */}
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
                  12%
                </div> */}
              </dd>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-base font-normal text-gray-900">
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
              <dt className="text-base font-normal text-gray-900">
                Health Factor
              </dt>
              <dd className="mt-1 flex justify-between items-baseline md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-indigo-600">
                  {accountSummary.healthFactor}
                </div>
                <div className="inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800 md:mt-2 lg:mt-0">
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
                  {accountSummary.LoanToValue}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </Panel>

      <Panel>
        <PanelGrid>
          <div>
            <PanelHeader>Deposit</PanelHeader>
            <PanelDescription>
              Deposit funds to provide liquidity and collatoral to the market.
            </PanelDescription>
          </div>
          <div className="">
            <InputWithToken
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              token={depositToken}
              onTokenChange={setDepositToken}
              tokens={[Celo, cUSD]}
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
      </Panel>

      <Panel>
        <PanelGrid>
          <div>
            <PanelHeader>Borrow</PanelHeader>
            <PanelDescription>
              By borrowing you are able to obtain liquidity (working capital)
              without selling your assets.
            </PanelDescription>
          </div>
          <div className="">
            <div className="space-y-4">
              <InputWithToken
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                token={borrowToken}
                onTokenChange={setBorrowToken}
                tokens={[Celo, cUSD]}
              />
              <div className="md:flex md:items-center md:justify-between">
                <div className="text-gray-500">Interest Rate</div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div>Stable</div>
                  <Toggle
                    active={interestRate === 'stable'}
                    onChange={(bool) =>
                      setInterestRate(bool ? 'stable' : 'variable')
                    }
                  />
                  <div>Variable</div>
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

      <Panel>
        <PanelHeader>Markets</PanelHeader>

        <div className="-mx-5">
          <Table
            headers={[
              'Ticker',
              'Market Size',
              'Total Borrowed',
              'Deposit APY',
              'Borrow APY (variable)',
              'Borrow APY (stable)',
            ]}
            loading={state === States.Loading}
            noDataMessage={'No reserve data found'}
            rows={reserves.map((r) => {
              const Icon = TokenIcons[r.ticker];
              return [
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

export default WithLayout(Lend);
