import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { FiatCurrency, tokens } from '../constants';
import { useContractKit, Network } from '@celo-tools/use-contractkit';
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts';
import { Accounts } from '@celo/contractkit/lib/generated/Accounts';
import { formatAmount } from 'utils';
import BigNumber from 'bignumber.js';
import { AddressUtils } from '@celo/utils';
import { Address } from '@celo/base';
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold';
import ERC20 from '../utils/abis/ERC20.json';

function getApolloClient(n: Network) {
  return new ApolloClient({
    uri: n.graphQl,
    cache: new InMemoryCache(),
  });
}

interface AccountSummary {
  address: string;
  name: string;
  authorizedSigners: {
    vote: Address;
    validator: Address;
    attestation: Address;
  };
  metadataURL: string;
  wallet: Address;
  dataEncryptionKey: string;
}

interface LockedAccountSummary {
  lockedGold: {
    total: BigNumber;
    nonvoting: BigNumber;
    requirement: BigNumber;
  };
  pendingWithdrawals: PendingWithdrawal[];
}
const defaultAccountSummary = {
  address: AddressUtils.NULL_ADDRESS,
  name: '',
  authorizedSigners: {
    vote: AddressUtils.NULL_ADDRESS,
    validator: AddressUtils.NULL_ADDRESS,
    attestation: AddressUtils.NULL_ADDRESS,
  },
  metadataURL: '',
  wallet: AddressUtils.NULL_ADDRESS,
  dataEncryptionKey: AddressUtils.NULL_ADDRESS,
};

const defaultBalances = tokens.reduce(
  (accum, cur) => ({
    ...accum,
    [cur.ticker]: new BigNumber(0),
  }),
  {}
);
const defaultLockedSummary = {
  lockedGold: {
    total: new BigNumber(0),
    nonvoting: new BigNumber(0),
    requirement: new BigNumber(0),
  },
  pendingWithdrawals: [],
};

const defaultSettings = {
  currency: FiatCurrency.USD,
  darkMode: false,
};
const LOCALSTORAGE_KEY = 'plock/settings';
let localSettings = {};
if (typeof localStorage !== 'undefined') {
  localSettings = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY) || '{}');
}
const initialSettings = {
  ...defaultSettings,
  ...localSettings,
};

function State() {
  const { network, kit, address } = useContractKit();
  const [graphql, setGraphql] = useState(getApolloClient(network));
  const [settings, setSettings] = useState(initialSettings);

  const [accountSummary, setAccountSummary] = useState<AccountSummary>(
    defaultAccountSummary
  );
  const [lockedSummary, setLockedSummary] = useState<LockedAccountSummary>(
    defaultLockedSummary
  );
  const [balances, setBalances] = useState<{
    [x: string]: BigNumber;
  }>(defaultBalances);

  useEffect(() => {
    setGraphql(getApolloClient(network));
  }, [network]);

  const fetchBalances = useCallback(async () => {
    if (!address) {
      return;
    }

    const erc20s = await Promise.all(
      tokens
        .filter((t) => t.networks[network.name])
        .map(async (t) => {
          const erc20 = new kit.web3.eth.Contract(
            ERC20 as any,
            t.networks[network.name]
          );

          // @ts-ignore
          const balance = await erc20.methods.balanceOf(address).call();

          return {
            ...t,
            balance,
          };
        })
    );
    const balances = erc20s.reduce(async (accum, t) => {
      const token = await t;
      return {
        ...accum,
        [t.ticker]: token.balance,
      };
    }, {});

    setBalances({
      ...defaultBalances,
      ...balances,
    });
  }, [address]);

  const fetchAccountSummary = useCallback(async () => {
    if (!address) {
      return;
    }

    const accounts = await kit.contracts.getAccounts();
    try {
      setAccountSummary(await accounts.getAccountSummary(address));
    } catch (_) {}
  }, [kit, address]);

  const fetchLockedSummary = useCallback(async () => {
    if (!address) {
      return;
    }

    const locked = await kit.contracts.getLockedGold();
    try {
      setLockedSummary(await locked.getAccountSummary(address));
    } catch (_) {}
  }, [kit, address]);

  const updateSetting = useCallback(
    (property: string, value: any) => {
      setSettings((s) => {
        const newSettings = { ...s, [property]: value };
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(newSettings));
        return newSettings;
      });
      localStorage;
    },
    [settings]
  );

  const toggleDarkMode = useCallback(() => {
    if (settings.darkMode) {
      document.querySelector('html').classList.remove('dark');
      updateSetting('darkMode', false);
    } else {
      document.querySelector('html').classList.add('dark');
      updateSetting('darkMode', true);
    }
  }, [settings, updateSetting]);

  const updateDefaultFiatCurrency = useCallback(
    (c: FiatCurrency) => {
      updateSetting('currency', c);
    },
    [updateSetting]
  );

  useEffect(() => {
    fetchAccountSummary();
    fetchBalances();
    fetchLockedSummary();
  }, [fetchAccountSummary, fetchBalances, fetchLockedSummary]);

  return {
    graphql,
    accountSummary,
    fetchAccountSummary,
    fetchBalances,
    balances,
    lockedSummary,
    fetchLockedSummary,

    toggleDarkMode,
    updateDefaultFiatCurrency,
    settings,
  };
}

export const Base = createContainer(State);
