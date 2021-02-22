import { ApolloClient, InMemoryCache } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';
import { createContainer } from 'unstated-next';
import { getGraphQlUrl } from '../constants';
import { Networks, useContractKit } from 'use-contractkit';
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
  const { network, kit } = useContractKit();
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

  useEffect(() => {
    if (!kit.defaultAccount) {
      return;
    }

    async function f() {
      const accounts = await kit.contracts.getAccounts();
      setAccountSummary(await accounts.getAccountSummary(kit.defaultAccount));
    }
    f();
  }, [kit]);

  return { network, graphql, summary };
}

export const Base = createContainer(State);
