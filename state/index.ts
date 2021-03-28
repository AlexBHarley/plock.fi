import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { FiatCurrency, getGraphQlUrl } from '../constants';
import { Networks, useContractKit } from '@celo-tools/use-contractkit';
import { AccountsWrapper } from '@celo/contractkit/lib/wrappers/Accounts';
import { Accounts } from '@celo/contractkit/lib/generated/Accounts';
import { formatAmount } from 'utils';
import BigNumber from 'bignumber.js';
import { AddressUtils } from '@celo/utils';
import { Address } from '@celo/base';
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold';

function getApolloClient(n: Networks) {
  return new ApolloClient({
    uri: getGraphQlUrl(n),
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

const defaultBalances = {
  CELO: new BigNumber(0),
  cUSD: new BigNumber(0),
  cEUR: new BigNumber(0),
};
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
    CELO: BigNumber;
    cUSD: BigNumber;
    cEUR: BigNumber;
  }>(defaultBalances);

  useEffect(() => {
    setGraphql(
      new ApolloClient({
        uri: getGraphQlUrl(network),
        cache: new InMemoryCache(),
      })
    );
  }, [network]);

  const fetchBalances = useCallback(async () => {
    if (!address) {
      return;
    }

    const [celoContract, cusdContract] = await Promise.all([
      kit.contracts.getGoldToken(),
      kit.contracts.getStableToken(),
    ]);

    const [CELO, cUSD] = await Promise.all([
      celoContract.balanceOf(address),
      cusdContract.balanceOf(address),
    ]);
    setBalances({
      ...defaultBalances,
      CELO,
      cUSD,
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
    network,
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
