import { useContractKit } from '@celo-tools/use-contractkit';
import { Token, tokens, TokenTicker } from '../constants';
import { InputHTMLAttributes, useState } from 'react';
import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import { CopyText } from './copy-text';
import { Modal } from './modals';
import QRCode from 'qrcode.react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full appearance-none block px-3 py-2 border border-gray-300 dark:border-gray-700  rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-600 w-64"
      {...props}
    />
  );
}

export function AddressInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    copyable: boolean;
  }
) {
  const [qrModal, setQrModal] = useState(false);

  return (
    <>
      {qrModal && (
        <Modal onDismiss={() => setQrModal(false)}>
          <QRCode
            className="w-48 w-48 md:h-96 md:w-96"
            style={{ height: undefined, width: undefined }}
            value={props.value as string}
          />
        </Modal>
      )}
      <div className="flex flex-col sm:flex-row sm:space-x-4 items-center">
        <Input
          type="text"
          placeholder="0x7d21685c17607338b313a7174bab6620bad0aab7"
          {...props}
        />

        <div className="flex items-center justify-around sm:justify-center sm:space-x-2 mt-3 sm:mt-0">
          {props.copyable && <CopyText text={props.value as string} />}

          <button onClick={() => setQrModal(true)}>
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

export function TokenInput(
  props: InputHTMLAttributes<HTMLInputElement> & {
    token?: TokenTicker;
    onTokenChange?: (t: TokenTicker) => void;
    tokens?: Token[];
    max?: string;
    onChange: (x: string) => void;
  }
) {
  const { network } = useContractKit();
  return (
    <div className="relative rounded-md shadow-sm w-full">
      <Input
        type="text"
        name="price"
        id="price"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder ?? '0'}
      />
      <div className="absolute inset-y-0 right-0 flex items-center">
        {props.max && (
          <button
            onClick={() => {
              const amount = new BigNumber(
                Web3.utils.fromWei(props.max, 'ether')
              );
              props.onChange(amount.toFixed(2));
            }}
            className="text-sm font-semibold text-gradient bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 outline-none focus:outline-none transition pr-2"
          >
            MAX
          </button>
        )}

        {props.onTokenChange && props.token && props.tokens && (
          <>
            <label htmlFor="currency" className="sr-only">
              Currency
            </label>
            <select
              id="currency"
              name="currency"
              className="w-28 focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 border-transparent bg-transparent  sm:text-sm rounded-md"
              value={props.token}
              onChange={(e) =>
                props.onTokenChange(e.target.value as TokenTicker)
              }
            >
              {(props.tokens || tokens)
                .filter((t) => !!t.networks[network.name])
                .map((t) => (
                  <option value={t.ticker}>
                    {t.ticker} ({t.name})
                  </option>
                ))}
            </select>
          </>
        )}
      </div>
    </div>
  );
}
