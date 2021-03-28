import { CURRENCY_ENUM } from '@celo/utils';
import {
  Balances,
  Input,
  Panel,
  PanelWithButton,
  toast,
  WithLayout,
} from 'components';
import { tokens, TokenTicker } from '../constants';
import { useEffect, useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';
import { quote, swap } from '../utils/uniswap';
import { Base } from 'state';
import Loader from 'react-loader-spinner';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';

enum States {
  Loading = 'Loading',
  Swapping = 'Swapping',
  None = 'None',
}

function Swap() {
  const { network, kit } = useContractKit();
  const { fetchBalances } = Base.useContainer();
  const [state, setState] = useState(States.None);
  const [fromToken, setFromToken] = useState(
    tokens.find((t) => t.ticker === TokenTicker.CELO)
  );
  const [fromAmount, setFromAmount] = useState('');
  const [toToken, setToToken] = useState(
    tokens.find((t) => t.ticker === TokenTicker.cUSD)
  );
  const [exchangeRateCache, setExchangeRateCache] = useState({});

  const handleSwap = async () => {
    try {
      setState(States.Swapping);
      await swap(
        kit,
        fromToken.networks[network],
        toToken.networks[network],
        Web3.utils.toWei(fromAmount)
      );
      fetchBalances();
      toast.success('Swap successful');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setState(States.None);
    }
  };

  useEffect(() => {
    setExchangeRateCache({});
  }, [network]);

  useEffect(() => {
    const key = `${fromToken.ticker}-${toToken.ticker}`;
    if (fromToken.ticker === toToken.ticker) {
      setExchangeRateCache((c) => ({
        ...c,
        [key]: 1,
      }));
      return;
    }

    async function f() {
      if (!exchangeRateCache[key]) {
        const [one, two] = await quote(
          kit,
          fromToken.networks[network],
          10000, // just to get some more decimal places
          [toToken.networks[network]]
        );

        setExchangeRateCache((c) => ({
          ...c,
          [key]: two / one,
        }));
      }
    }
    f();
  }, [kit, fromToken, toToken]);

  return (
    <>
      <Panel>
        <h3 className="text-lg font-medium leading-6 text-gray-200">Swap</h3>
        <p className="text-gray-400 mt-2 text-sm">
          Celo uses a formal on-chain governance mechanism to manage and upgrade
          the protocol. You can have your say in this by{' '}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://docs.celo.org/celo-owner-guide/voting-governance"
          ></a>
          voting on proposals and being active in the community. More
          information around this can be found in the{' '}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://docs.celo.org/celo-codebase/protocol/governance"
          >
            Governance documentation
          </a>
          .
        </p>
      </Panel>

      <PanelWithButton>
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row items-center justify-around md:space-x-6">
          <div className="relative rounded-md shadow-sm w-full">
            <input
              type="text"
              name="price"
              id="price"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              // className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
              className="w-full appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20 w-64"
              placeholder={'0'}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <label htmlFor="currency" className="sr-only">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-2 mr-2 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md"
                value={fromToken.ticker}
                onChange={(e) =>
                  setFromToken(tokens.find((t) => t.ticker === e.target.value))
                }
              >
                {tokens
                  .filter((t) => !!t.networks[network])
                  .map((t) => (
                    <option value={t.ticker}>
                      {t.ticker} ({t.name})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="text-gray-200">to</div>

          <div className="relative rounded-md shadow-sm w-full">
            <input
              type="text"
              name="price"
              id="price"
              readOnly
              disabled
              value={`${new BigNumber(fromAmount || 0)
                .multipliedBy(
                  exchangeRateCache[`${fromToken.ticker}-${toToken.ticker}`] ||
                    new BigNumber(0)
                )
                .toFixed(2)} (estimated)`}
              className="w-full appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20 w-64"
              placeholder={'0'}
            />
            <div className="absolute inset-y-0 right-0 flex items-center">
              <label htmlFor="currency" className="sr-only">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-2 mr-2 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md"
                value={toToken.ticker}
                onChange={(e) => {
                  console.log(e.target.value);
                  setToToken(tokens.find((t) => t.ticker === e.target.value));
                }}
              >
                {tokens
                  .filter((t) => !!t.networks[network])
                  .map((t) => (
                    <option value={t.ticker}>
                      {t.ticker} ({t.name})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={state === States.Swapping}
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {state === States.Swapping ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Swap'
          )}
        </button>

        {/* <div className="text-gray-400 text-xs mt-2">
              Sending <span className="text-white">{toWei(amount)} </span>
              <span className="text-white">{currency} </span>to{' '}
              <span className="text-white">{toAddress}</span>
            </div> */}
      </PanelWithButton>

      <Balances />
    </>
  );
}

export default WithLayout(Swap);
