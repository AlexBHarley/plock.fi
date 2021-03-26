import { useContractKit } from '@celo-tools/use-contractkit';
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold';
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold';
import { CURRENCIES } from '@celo/utils';
import BigNumber from 'bignumber.js';
import {
  CopyText,
  Input,
  Panel,
  PanelWithButton,
  toast,
  WithLayout,
} from 'components';
import { format, differenceInDays, differenceInSeconds } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import {
  buildStyles,
  CircularProgressbar,
  CircularProgressbarWithChildren,
} from 'react-circular-progressbar';
import Loader from 'react-loader-spinner';
import { Base } from 'state';
import { formatAmount, toWei, truncateAddress } from 'utils';
import {
  deployReleaseCelo,
  ReleaseGoldConfig,
} from '../../utils/deploy-release-celo';
import Web3 from 'web3';

function Stream() {
  const { address, kit, network, send } = useContractKit();
  const { balances, fetchBalances } = Base.useContainer();
  const [showTiny, setShowTiny] = useState(false);

  const [releaseCeloWrapper, setReleaseCeloWrapper] = useState(null);
  const [loading, setLoading] = useState(false);
  const [streamAddress, setStreamAddress] = useState('');

  const [amount, setAmount] = useState('0');
  const [toAddress, setToAddress] = useState('');

  const [error, setError] = useState('');
  const [config, setConfig] = useState({
    beneficiary: '',
    start: new Date(),
    end: new Date(),
    amount: '0',
  });

  const update = (property: string, value: any) =>
    setConfig((c) => ({ ...c, [property]: value }));

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
    const secondsDiff = Math.abs(differenceInSeconds(config.start, config.end));
    const daysDiff = Math.abs(differenceInDays(config.start, config.end));
    if (daysDiff < 1) {
      setError('Dates must be at least a day apart');
      return;
    }

    const weiAmount = new BigNumber(Web3.utils.toWei(config.amount));
    const amountPerSecond = weiAmount.div(secondsDiff);

    if (amountPerSecond.lt(1)) {
      // we need to change to release 1 wei per period, not 1 wei per second
      throw new Error('Not working right now');
    }

    console.log('amountPerSecond', amountPerSecond.toString());

    // we want CELO to be released every second. So we must find the amount
    // that can be released per second. It may be
    // must calculate smallest amount that can get released per second

    const releaseCeloConfig = {
      amountReleasedPerPeriod: amountPerSecond,
      beneficiary: config.beneficiary,
      canValidate: false,
      canVote: false,
      initialDistributionRatio: 1000,
      numReleasePeriods: secondsDiff,
      refundAddress: address,
      releaseOwner: address,
      releaseCliffTime: 0,
      releasePeriod: 1,
      releaseStartTime: config.start,
      revocable: true,
      subjectToLiquidityProvision: false,
    };
    console.log(releaseCeloConfig);

    await deployReleaseCelo(kit, releaseCeloConfig, address);
  }, [kit, address, config]);

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
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-200">
              Deploy
            </h3>
            <p className="mt-1 text-sm text-gray-400">Create a new stream</p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-3 sm:col-span-2">
                  <label
                    htmlFor="company_website"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Beneficiary
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <Input
                      type="text"
                      value={config.beneficiary}
                      onChange={(e) => update('beneficiary', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-300"
                >
                  Start Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="start"
                    name="start"
                    value={format(config.start, 'yyyy-MM-dd')}
                    onChange={(e) => {
                      console.log('start', e.target.value);
                      update('start', new Date(e.target.value));
                    }}
                    min="2020-05-01"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Brief description for your profile. URLs are hyperlinked.
                </p>
              </div>

              <div>
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-300"
                >
                  End Date
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    id="end"
                    name="end"
                    value={format(config.end, 'yyyy-MM-dd')}
                    onChange={(e) => update('end', new Date(e.target.value))}
                    min="2020-05-01"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-300"
                >
                  Amount
                </label>
                <div className="mt-1">
                  <Input
                    type="text"
                    value={config.amount}
                    onChange={(e) => update('amount', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div>
              <div className="text-sm text-red-500">{error}</div>
            </div>
          )}
        </div>

        <button
          onClick={deploy}
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

console.log(WithLayout(Stream));

export default WithLayout(Stream);
