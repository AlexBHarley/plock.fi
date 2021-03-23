import { useContractKit } from '@celo-tools/use-contractkit';
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold';
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold';
import BigNumber from 'bignumber.js';
import { CopyText, Panel, PanelWithButton, toast } from 'components';
import { useCallback, useEffect, useState } from 'react';
import {
  buildStyles,
  CircularProgressbar,
  CircularProgressbarWithChildren,
} from 'react-circular-progressbar';
import Loader from 'react-loader-spinner';
import { Base } from 'state';
import { formatAmount, truncateAddress } from 'utils';
import {
  deployReleaseCelo,
  ReleaseGoldConfig,
} from '../../utils/deploy-release-celo';

enum Currencies {
  CELO = 'CELO',
  cUSD = 'cUSD',
  cEUR = 'cEUR',
}

export default function Transfer() {
  const { address, kit, network, send } = useContractKit();
  const { balances, fetchBalances } = Base.useContainer();
  const [showTiny, setShowTiny] = useState(false);

  const [releaseCeloWrapper, setReleaseCeloWrapper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamAddress, setStreamAddress] = useState('');

  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState(Currencies.CELO);
  const [toAddress, setToAddress] = useState('');

  const [
    newReleaseCeloConfig,
    setNewReleaseCeloConfig,
  ] = useState<ReleaseGoldConfig>({
    amountReleasedPerPeriod: 0,
    beneficiary: '',
    canValidate: false,
    canVote: false,
    identifier: '',
    initialDistributionRatio: 0,
    numReleasePeriods: 0,
    refundAddress: '',
    releaseOwner: '',
    releaseCliffTime: 0,
    releasePeriod: 0,
    releaseStartTime: '',
    revocable: false,
    subjectToLiquidityProvision: false,
  });

  const [stream, setStream] = useState<{
    released: BigNumber;
    total: BigNumber;
    withdrawn: BigNumber;
    locked: BigNumber;
    unlocked: BigNumber;
    address: string;
    withdrawable: boolean;
  } | null>(null);

  const deploy = useCallback(async () => {
    await deployReleaseCelo(kit.web3, newReleaseCeloConfig, address);
  }, [kit, address, newReleaseCeloConfig]);

  const withdraw = useCallback(async () => {
    const rgw = new ReleaseGoldWrapper(
      kit,
      newReleaseGold(kit.connection.web3, stream.address)
    );

    try {
      await send(rgw.withdraw(stream.unlocked));
      toast.success('Withdrawn');
    } catch (e) {
      toast.error(e.message);
    }
  }, [stream]);

  const connect = useCallback(async () => {
    // const releaseCelo = await kit._web3Contracts.
    const rgw = new ReleaseGoldWrapper(
      kit,
      newReleaseGold(kit.connection.web3, streamAddress)
    );
    const accounts = await kit.contracts.getAccounts();
    const [
      total,
      withdrawn,
      released,
      locked,
      unlocked,
      beneficiary,
    ] = await Promise.all([
      rgw.getTotalBalance(),
      rgw.getTotalWithdrawn(),
      rgw.getCurrentReleasedTotalAmount(),
      rgw.getRemainingLockedBalance(),
      rgw.getRemainingUnlockedBalance(),
      rgw.getBeneficiary(),
    ]);

    let withdrawable = false;
    if ((await accounts.signerToAccount(beneficiary)) === address) {
      withdrawable = true;
    }

    setStream({
      total,
      withdrawn,
      released,
      locked,
      unlocked,
      address: streamAddress,
      withdrawable,
    });
  }, [kit, streamAddress]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const innerRingValue = stream
    ? (stream.withdrawn.toNumber() / stream.total.toNumber()) * 100
    : 0;
  const outerRingValue = stream
    ? (stream.released.toNumber() / stream.total.toNumber()) * 100
    : 0;

  return (
    <>
      <Panel>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Stream
          </h3>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            With CELO you can easily stream funds to recipients via{' '}
            <a
              href="https://docs.celo.org/celo-owner-guide/release-gold"
              className="text-blue-500"
              target="_blank"
            >
              ReleaseCelo
            </a>{' '}
            functionality. Recipients of a stream can claim their funds as soon
            as it is released.
          </p>
        </div>
      </Panel>

      <PanelWithButton>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Deploy
          </h3>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Create a new stream
          </p>

          <div className="pt-4">
            <input
              className="w-full appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20 w-64"
              type="text"
              value={streamAddress}
              onChange={(e) => setStreamAddress(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={connect}
          disabled={loading}
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {loading ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Submit'
          )}
        </button>
      </PanelWithButton>

      <PanelWithButton>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Connect
          </h3>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Enter the address of a stream below to get an overview and interact
            with it.
          </p>

          <div className="pt-4">
            <input
              className="w-full appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20 w-64"
              type="text"
              value={streamAddress}
              onChange={(e) => setStreamAddress(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={connect}
          disabled={loading}
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {loading ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Submit'
          )}
        </button>
      </PanelWithButton>

      {stream && (
        <Panel>
          <div className="">
            <div className="space-x-2">
              <span className="text-gray-400">ReleaseCelo:</span>
              <span className="text-gray-200">
                {truncateAddress(stream.address)}
              </span>
              <CopyText text={stream.address} />
            </div>

            <div className="space-x-2">
              <span className="text-gray-400">Released:</span>
              <span className="text-gray-200">
                {formatAmount(stream.released, 2)} /{' '}
                {formatAmount(stream.total, 2)} CELO
              </span>
            </div>

            <div className="space-x-2">
              <span className="text-gray-400">Claimed:</span>
              <span className="text-gray-200">
                {formatAmount(stream.withdrawn, 2)} /{' '}
                {formatAmount(stream.total, 2)} CELO
              </span>
            </div>
          </div>

          <CircularProgressbarWithChildren
            value={outerRingValue}
            strokeWidth={8}
            styles={buildStyles({
              pathColor: '#f00',
              trailColor: 'transparent',
            })}
          >
            {/*
          Width here needs to be (100 - 2 * strokeWidth)% 
          in order to fit exactly inside the outer progressbar.
        */}
            <div style={{ width: '84%' }}>
              <CircularProgressbar
                value={innerRingValue}
                styles={buildStyles({
                  pathColor: 'green',
                  trailColor: 'transparent',
                })}
              />
            </div>
          </CircularProgressbarWithChildren>

          {stream.withdrawable && (
            <button
              onClick={withdraw}
              className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              Withdraw Remaining
            </button>
          )}
        </Panel>
      )}
    </>
  );
}
