import { gql, useLazyQuery } from '@apollo/client';
import { useContractKit } from '@celo-tools/use-contractkit';
import {
  AddressInput,
  Balances,
  CopyText,
  Input,
  Panel,
  PanelGrid,
  PanelHeader,
  PanelWithButton,
  Table,
  toast,
  TokenInput,
  WithLayout,
} from '../components';
import { Toggle } from '../components/toggle';
import { useEffect, useState } from 'react';
import { HiOutlineExternalLink } from 'react-icons/hi';
import { IoMdRefresh } from 'react-icons/io';
import { Base } from '../state';
import { formatAmount, truncateAddress } from '../utils';
import Web3 from 'web3';
import { Celo, tokens } from '../constants';
import ERC20 from '../utils/abis/ERC20.json';

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

export function Transfer() {
  const { address, kit, network, performActions } = useContractKit();
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
  const [currency, setCurrency] = useState(Celo);
  const [toAddress, setToAddress] = useState('');

  const transfer = async () => {
    const contractAddress = currency.networks[network.name];
    if (!contractAddress) {
      toast.error(`${currency.name} not deployed on ${network.name}`);
      return;
    }

    try {
      await performActions(async (k) => {
        const erc20 = new kit.web3.eth.Contract(ERC20 as any, contractAddress);
        await erc20.methods
          .transfer(toAddress, Web3.utils.toWei(amount, 'ether'))
          .send({ from: address });
      });
      toast.success(`${amount} ${currency} sent`);
      fetchBalances();
    } catch (e) {
      toast.error(e.message);
    }
  };

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
      <PanelWithButton>
        <div>
          <PanelHeader>Transfer</PanelHeader>
          <div>
            <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row items-center md:space-x-2">
              <TokenInput
                type="text"
                name="price"
                id="price"
                value={amount}
                onChange={(e) => setAmount(e)}
                placeholder={'0'}
                token={currency}
                onTokenChange={(token) => setCurrency(token)}
                max={formatAmount(balances[currency.ticker])}
              />

              <div className="text-gray-900 dark:text-gray-200">to</div>

              <AddressInput
                value={toAddress}
                copyable={false}
                onChange={(e) => setToAddress(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button onClick={transfer} className="ml-auto primary-button">
          Send
        </button>
      </PanelWithButton>

      <Panel>
        <PanelGrid>
          <PanelHeader>Receive</PanelHeader>

          <AddressInput copyable disabled readOnly value={address} />
        </PanelGrid>
      </Panel>

      <Balances />

      <Panel>
        <div className="flex flex-col md:flex-row md:items-center">
          <h3 className=" whitespace-nowrap mb-3 md:mb-0">Past transfers</h3>

          <div className="flex items-center justify-between space-x-8 md:ml-auto">
            <div className="flex items-center space-x-3">
              <div className="text-xs ">Show tiny transfers</div>
              <Toggle
                active={showTiny}
                onChange={(value) => setShowTiny(value)}
                disabled={false}
              />
            </div>

            <button className="" onClick={() => refetch()}>
              <IoMdRefresh
                className=""
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
                    <div className="text-sm font-medium">Unknown</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 flex-items-center space-x-2">
                      <span>{truncateAddress(displayAddress)}</span>
                      <CopyText text={displayAddress} />
                    </div>
                  </div>
                </div>,
                <span className={toMe ? 'text-green-500' : 'text-red-400'}>
                  {formatAmount(node.value)} {node.token}
                </span>,
                <div className="text-sm text-gray-900">{node.comment}</div>,
                <span className="px-2 inline-flex text-xs leading-5 font-semibold text-gray-600 dark:text-gray-400">
                  <a
                    className="flex space-x-2 items-center"
                    href={`${network.graphQl}/txs/${node.transactionHash}`}
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
