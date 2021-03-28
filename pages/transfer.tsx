import { gql, useLazyQuery } from '@apollo/client';
import {
  Balances,
  CopyText,
  Panel,
  Table,
  toast,
  WithLayout,
} from 'components';
import { Toggle } from 'components/toggle';
import { getGraphQlUrl } from '../constants';
import { useCallback, useEffect, useState } from 'react';
import { IoMdRefresh } from 'react-icons/io';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { useContractKit } from '@celo-tools/use-contractkit';
import { formatAmount, toWei, truncateAddress } from 'utils';
import Web3 from 'web3';
import { Base } from 'state';

enum Currencies {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
}

const transferQuery = gql`
  query Transfers($address: String) {
    celoTransfers(addressHash: $address, first: 100) {
      edges {
        node {
          comment
          value
          token
          toAddressHash
          fromAddressHash
          transactionHash
        }
      }
    }
  }
`;

function Transfer() {
  const { address, kit, network, send } = useContractKit();
  const { balances, fetchBalances } = Base.useContainer();
  const [showTiny, setShowTiny] = useState(false);
  const [loadTransfers, { loading, data, refetch }] = useLazyQuery(
    transferQuery,
    {
      variables: {
        address: kit.defaultAccount,
      },
    }
  );
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState(Currencies.CELO);
  const [toAddress, setToAddress] = useState('');

  const transfer = useCallback(async () => {
    let contract;
    if (currency === Currencies.CELO) {
      contract = await kit.contracts.getGoldToken();
    } else if (currency === Currencies.cUSD) {
      contract = await kit.contracts.getStableToken();
    } else {
      throw new Error('Unsupported currency');
    }

    await send(contract.transfer(toAddress, Web3.utils.toWei(amount, 'ether')));
    toast.success(`${amount} ${currency} sent`);
    fetchBalances();
  }, [amount, currency, kit, fetchBalances, send]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    loadTransfers({ variables: { address: kit.defaultAccount } });
  }, [loadTransfers, kit.defaultAccount]);

  const transfers =
    kit.defaultAccount && data
      ? data.celoTransfers.edges
          .map(({ node }) => node)
          .filter((n) => {
            if (showTiny) {
              return true;
            }
            return parseFloat(Web3.utils.fromWei(n.value, 'ether')) > 0.01;
          })
      : [];

  return (
    <>
      <Panel>
        <h3 className="text-gray-200">New Transfer</h3>
        <div>
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row items-center md:space-x-2">
            <div className="mt-1 relative rounded-md shadow-sm w-full">
              <input
                type="text"
                name="price"
                id="price"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
                  className="focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-10 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currencies)}
                >
                  {Object.values(Currencies).map((c) => (
                    <option>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-gray-200">to</div>

            <input
              type="text"
              placeholder="0x1234567890987654321"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
            />
          </div>

          <div className="text-gray-400 text-xs mt-2">
            Sending <span className="text-white">{toWei(amount)} </span>
            <span className="text-white">{currency} </span>to{' '}
            <span className="text-white">{toAddress}</span>
          </div>
        </div>

        <button
          onClick={transfer}
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          Send
        </button>
      </Panel>

      <Balances />

      <Panel>
        <div className="flex flex-col md:flex-row md:items-center">
          <h3 className="text-gray-300 whitespace-nowrap mb-3 md:mb-0">
            Past transfers
          </h3>

          <div className="flex items-center justify-between space-x-8 md:ml-auto">
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-300">Show tiny transfers</div>
              <Toggle
                active={showTiny}
                onChange={(value) => setShowTiny(value)}
                disabled={false}
              />
            </div>

            <button className="" onClick={() => refetch()}>
              <IoMdRefresh
                className="text-gray-300"
                style={{ height: '20px', width: '20px' }}
              />
            </button>
          </div>
        </div>

        <div className="-mx-5">
          <Table
            headers={['Name', 'Amount', 'Comment', 'Link']}
            loading={loading}
            noDataMessage={
              kit.defaultAccount
                ? 'No transfers found'
                : 'Need to connect an account before viewing transfers'
            }
            rows={transfers.map((node) => {
              const toMe = node.toAddressHash === kit.defaultAccount;
              const displayAddress = toMe
                ? node.fromAddressHash
                : node.toAddressHash;

              return [
                <div className="flex items-center">
                  <div className="">
                    <div className="text-sm font-medium text-gray-300">
                      Unknown
                    </div>
                    <div className="text-sm text-gray-400 flex-items-center space-x-2">
                      <span>{truncateAddress(displayAddress)}</span>
                      <CopyText text={displayAddress} />
                    </div>
                  </div>
                </div>,
                <span className={toMe ? 'text-green-500' : 'text-red-400'}>
                  {formatAmount(node.value)} {node.token}
                </span>,
                <div className="text-sm text-gray-900">{node.comment}</div>,
                <span className="px-2 inline-flex text-xs leading-5 font-semibold text-gray-400">
                  <a
                    className="flex space-x-2 items-center"
                    href={`${getGraphQlUrl(network)}/txs/${
                      node.transactionHash
                    }`}
                  >
                    <span>{node.transactionHash.slice(0, 8)}...</span>
                    <HiOutlineExternalLink />
                  </a>
                </span>,
              ];
            })}
          />
        </div>
      </Panel>
    </>
  );
}

export default WithLayout(Transfer);
