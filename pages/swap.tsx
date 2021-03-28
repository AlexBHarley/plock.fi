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
        // @ts-ignore
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
          // @ts-ignore
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
      <PanelWithButton>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">Swap</h3>
          <p className="text-gray-400 mt-2 text-sm">
            Plock uses{' '}
            <a
              className="text-blue-500"
              target="_blank"
              href="https://ubeswap.org"
            >
              Ubeswap
            </a>
            , a decentralised exchange to handle swapping tokens.
            <p className="mt-2">
              Remember that the exact amount exchanged may differ from what we
              display on the swap interface below, it is only an estimation.
            </p>
            .
          </p>

          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row items-center justify-around md:space-x-6">
            <div className="relative rounded-md shadow-sm w-full">
              <Input
                type="text"
                name="price"
                id="price"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder={'0'}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <label htmlFor="currency" className="sr-only">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="w-36 focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md"
                  value={fromToken.ticker}
                  onChange={(e) =>
                    setFromToken(
                      tokens.find((t) => t.ticker === e.target.value)
                    )
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
              <Input
                type="text"
                name="price"
                id="price"
                readOnly
                disabled
                value={`${new BigNumber(fromAmount || 0)
                  .multipliedBy(
                    exchangeRateCache[
                      `${fromToken.ticker}-${toToken.ticker}`
                    ] || new BigNumber(0)
                  )
                  .toFixed(2)}`}
                placeholder={'0'}
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <label htmlFor="currency" className="sr-only">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="w-36 focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-2 mr-2 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md"
                  value={toToken.ticker}
                  onChange={(e) => {
                    setToToken(tokens.find((t) => t.ticker === e.target.value));
                  }}
                >
                  {tokens
                    .filter((t) => !!t.networks[network])
                    .map((t) => (
                      <option
                        value={t.ticker}
                        label={`${t.ticker} (${t.name})`}
                      />
                    ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSwap}
          disabled={state === States.Swapping}
          className="ml-auto primary-button"
        >
          {state === States.Swapping ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Swap'
          )}
        </button>
      </PanelWithButton>

      <Balances />
    </>
  );
}

export default WithLayout(Swap);
