import { useContractKit } from '@celo-tools/use-contractkit';
import BigNumber from 'bignumber.js';
import {
  Balances,
  Input,
  PanelWithButton,
  toast,
  TokenInput,
  WithLayout,
} from '../components';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Base } from '../state';
import Web3 from 'web3';
import { Celo, cUSD, Token, tokens, TokenTicker } from '../constants';
import { quote, swap } from '../utils/uniswap';

enum States {
  Loading = 'Loading',
  Swapping = 'Swapping',
  None = 'None',
}

const buildCacheKey = (from: Token, to: Token) => `${from.ticker}-${to.ticker}`;

export function Swap() {
  const { network, kit, performActions, address } = useContractKit();
  const { fetchBalances, balances, track } = Base.useContainer();
  const [state, setState] = useState(States.None);
  const [fromToken, setFromToken] = useState(Celo);
  const [amounts, setAmounts] = useState({ from: '', to: '' });
  const [toToken, setToToken] = useState(cUSD);
  const [exchangeRateCache, setExchangeRateCache] = useState({});

  const handleSwap = async () => {
    const amount = Web3.utils.toWei(amounts.from);
    track('swap/swap', {
      from: fromToken.ticker,
      to: toToken.ticker,
      amount,
    });
    await performActions(async (k) => {
      try {
        setState(States.Swapping);
        await swap(
          k as any,
          address,
          fromToken.networks[network.name],
          toToken.networks[network.name],
          amount
        );
        setAmounts({ from: '', to: '' });
        fetchBalances();
        toast.success('Swap successful');
      } catch (e) {
        toast.error(e.message);
      } finally {
        setState(States.None);
      }
    });
  };

  useEffect(() => {
    setExchangeRateCache({});
  }, [network]);

  useEffect(() => {
    const key = buildCacheKey(fromToken, toToken);
    if (fromToken.ticker === toToken.ticker) {
      setExchangeRateCache((c) => ({
        ...c,
        [key]: 1,
      }));
      return;
    }

    async function f() {
      if (!exchangeRateCache[key]) {
        const rate = await quote(
          kit as any,
          fromToken.networks[network.name],
          Web3.utils.toWei('1', 'ether'), // just to get some more decimal places
          toToken.networks[network.name]
        );

        setExchangeRateCache((c) => ({
          ...c,
          [key]: Web3.utils.fromWei(rate),
        }));
      }
    }
    f();
  }, [kit, fromToken, toToken]);

  return (
    <>
      <PanelWithButton>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
            Swap
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
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
            <TokenInput
              value={amounts.from}
              onChange={(from) => {
                if (!from) {
                  setAmounts({ from: '', to: '' });
                  return;
                }

                const key = buildCacheKey(fromToken, toToken);
                const rate = exchangeRateCache[key] ?? 1;

                const to = new BigNumber(from)
                  .multipliedBy(new BigNumber(rate))
                  .toFixed(2);
                setAmounts({ from, to });
              }}
              token={fromToken}
              onTokenChange={(t) => setFromToken(t)}
              max={balances[fromToken.ticker].toString()}
            />

            <div className="text-gray-900 dark:text-gray-200">to</div>

            <TokenInput
              value={amounts.to}
              onChange={(to) => {
                if (to === amounts.to) {
                  return;
                }
                if (!to) {
                  setAmounts({ from: '', to: '' });
                  return;
                }

                const key = buildCacheKey(fromToken, toToken);
                const rate = exchangeRateCache[key] ?? 1;

                const from = new BigNumber(to)
                  .dividedBy(new BigNumber(rate))
                  .toFixed(2);
                setAmounts({ from, to });
              }}
              token={toToken}
              onTokenChange={(t) => setToToken(t)}
            />
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
