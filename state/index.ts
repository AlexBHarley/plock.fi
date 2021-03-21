import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { getGraphQlUrl } from '../constants';
import { Networks, useContractKit } from '@celo-tools/use-contractkit';
import { Address } from '@celo/contractkit';
import { Accounts } from '@celo/contractkit/lib/generated/Accounts';

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

function State() {
  const { network, kit, address } = useContractKit();
  const [graphql, setGraphql] = useState(getApolloClient(network));

  const [summary, setAccountSummary] = useState<AccountSummary>({
    address: '',
    name: '',
    authorizedSigners: {
      vote: '',
      validator: '',
      attestation: '',
    },
    metadataURL: '',
    wallet: '',
    dataEncryptionKey: '',
  });

  useEffect(() => {
    setGraphql(
      new ApolloClient({
        uri: getGraphQlUrl(network),
        cache: new InMemoryCache(),
      })
    );
  }, [network]);

  const fetchSummary = useCallback(async () => {
    if (!address) {
      return;
    }

    const accounts = await kit.contracts.getAccounts();
    try {
      setAccountSummary(await accounts.getAccountSummary(address));
    } catch (e) {}
  }, [kit, address]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { network, graphql, summary, fetchSummary };
}

export const Base = createContainer(State);
