import { useContractKit } from '@celo-tools/use-contractkit';
import { tokens, TokenTicker } from '../constants';
import { InputHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full appearance-none block px-3 py-2 border border-gray-300 dark:border-gray-700  rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-600 w-64"
      {...props}
    />
  );
}

export function InputWithToken(
  props: InputHTMLAttributes<HTMLInputElement> & {
    token: TokenTicker;
    onTokenChange: (t: TokenTicker) => void;
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
        onChange={props.onChange}
        placeholder={'0'}
      />
      <div className="absolute inset-y-0 right-0 flex items-center">
        <label htmlFor="currency" className="sr-only">
          Currency
        </label>
        <select
          id="currency"
          name="currency"
          className="w-36 focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 border-transparent bg-transparent  sm:text-sm rounded-md"
          value={props.token}
          onChange={(e) => props.onTokenChange(e.target.value as TokenTicker)}
        >
          {tokens
            .filter((t) => !!t.networks[network.name])
            .map((t) => (
              <option value={t.ticker}>
                {t.ticker} ({t.name})
              </option>
            ))}
        </select>
      </div>
    </div>
  );
}
