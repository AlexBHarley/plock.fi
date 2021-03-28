import { useContractKit } from '@celo-tools/use-contractkit';
import { newReleaseGold } from '@celo/contractkit/lib/generated/ReleaseGold';
import { ReleaseGoldWrapper } from '@celo/contractkit/lib/wrappers/ReleaseGold';
import { CURRENCIES } from '@celo/utils';
import { eqAddress } from '@celo/base/lib/address';
import BigNumber from 'bignumber.js';
import {
  CopyText,
  Input,
  Panel,
  PanelWithButton,
  toast,
  TokenIcons,
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
import { deployReleaseCelo } from '../../utils/deploy-release-celo';
import React from 'react';

class GradientSVG extends React.Component {
  render() {
    // @ts-ignore
    let { startColor, endColor, idCSS, rotation } = this.props;

    let gradientTransform = `rotate(${rotation})`;

    return (
      <svg style={{ height: 0 }}>
        <defs>
          <linearGradient id={idCSS} gradientTransform={gradientTransform}>
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      </svg>
    );
  }
}

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

  const connect = useCallback(
    async (rgAddress: string) => {
      const rgw = new ReleaseGoldWrapper(
        // @ts-ignore
        kit,
        // @ts-ignore
        newReleaseGold(kit.connection.web3, rgAddress)
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
      try {
        if (eqAddress(beneficiary, address)) {
          withdrawable = true;
        }
        if (eqAddress(await accounts.signerToAccount(beneficiary), address)) {
          withdrawable = true;
        }
      } catch (e) {}

      setStream({
        total,
        withdrawn,
        released,
        locked,
        unlocked,
        address: rgAddress,
        withdrawable,
      });
    },
    [kit]
  );

  const deploy = useCallback(async () => {
    if (config.start.getTime() < config.end.getTime()) {
      toast.error('End date must be after start date');
      return;
    }

    if (!config.amount || !config.beneficiary) {
      toast.error('Missing parameters');
      return;
    }

    try {
      const rgAddress = await deployReleaseCelo(
        {
          from: address,
          to: config.beneficiary,
          amount: amount,
          start: config.start,
          end: config.end,
        },
        // @ts-ignore
        kit
      );
      toast.success('Release succeeded');
      connect(rgAddress);
    } catch (e) {}
  }, [kit, address, config, connect]);

  const withdraw = useCallback(async () => {
    const rgw = new ReleaseGoldWrapper(
      // @ts-ignore
      kit,
      // @ts-ignore
      newReleaseGold(kit.connection.web3, stream.address)
    );

    console.log(stream);
    try {
      await rgw
        .withdraw(stream.released.minus(stream.withdrawn))
        .sendAndWaitForReceipt({ from: address });
      connect(stream.address);
      toast.success('Withdrawn');
    } catch (e) {
      toast.error(e.message);
    }
  }, [stream, address, connect]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const innerRingValue = stream
    ? (stream.withdrawn.toNumber() / stream.total.toNumber()) * 100
    : 0;
  const outerRingValue = stream
    ? (stream.released.toNumber() / stream.total.toNumber()) * 100
    : 0;
  const releasedPercent = stream
    ? stream.released.dividedBy(stream.total).multipliedBy(100).toFixed(0)
    : '0';

  return (
    <>
      <Panel>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Stream
          </h3>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            With Plock you can stream funds to recipients for realtime payments.
            This allows recipients to claim their funds on an ongoing basis as
            soon as it becomes available to them.
          </p>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Plock enables this functionality via{' '}
            <a
              href="https://docs.celo.org/celo-owner-guide/release-gold"
              className="text-blue-500"
              target="_blank"
            >
              ReleaseCelo
            </a>{' '}
            if you'd like to read more about how it works.
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
              <div>
                <label
                  htmlFor="company_website"
                  className="block text-sm font-medium text-gray-300"
                >
                  Beneficiary
                </label>
                <div className="mt-1">
                  <Input
                    type="text"
                    value={config.beneficiary}
                    onChange={(e) => update('beneficiary', e.target.value)}
                  />
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
                  <Input
                    type="date"
                    id="start"
                    name="start"
                    value={format(config.start, 'yyyy-MM-dd')}
                    onChange={(e) => update('start', new Date(e.target.value))}
                    min="2020-05-01"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="about"
                  className="block text-sm font-medium text-gray-300"
                >
                  End Date
                </label>
                <div className="mt-1">
                  <Input
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
        </div>

        <button
          onClick={deploy}
          disabled={loading}
          className="ml-auto primary-button"
        >
          {loading ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Submit'
          )}
        </button>
      </PanelWithButton>

      <Panel>
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-200">
              View
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Enter the address of a stream to get an overview and withdraw
              funds.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="flex flex-col space-y-4">
              <div>
                <label
                  htmlFor="company_website"
                  className="block text-sm font-medium text-gray-300"
                >
                  Stream address
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <Input
                    className="w-full appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20 w-64"
                    type="text"
                    value={streamAddress}
                    onChange={(e) => setStreamAddress(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => connect(streamAddress)}
                disabled={loading}
                className="ml-auto primary-button"
              >
                {loading ? (
                  <Loader
                    type="TailSpin"
                    height={24}
                    width={24}
                    color="white"
                  />
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>

        {stream && (
          <div className="flex flex-col my-2">
            <GradientSVG
              // @ts-ignore
              startColor="#60A5FA"
              endColor="#1E40AF"
              rotation="90"
              idCSS="outer"
            />

            <GradientSVG
              // @ts-ignore
              startColor="#B45309"
              endColor="#FCD34D"
              rotation="90"
              idCSS="inner"
            />

            <div className="md:px-24">
              <CircularProgressbarWithChildren
                value={outerRingValue}
                strokeWidth={5}
                className="OuterCircularProgressbar"
              >
                <div style={{ width: '84%' }}>
                  <CircularProgressbarWithChildren
                    strokeWidth={5}
                    value={innerRingValue}
                    className="InnerCircularProgressbar"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <span className="mb-4">
                        <TokenIcons.CELO height="40px" width="40px" />
                      </span>

                      <div className="text-2xl md:text-5xl font-medium text-gray-200 mb-2">
                        {formatAmount(stream.released)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300 md:text-2xl">
                          / {formatAmount(stream.total)} CELO total
                        </span>
                      </div>
                    </div>
                  </CircularProgressbarWithChildren>
                </div>
              </CircularProgressbarWithChildren>
            </div>

            {stream.withdrawable && (
              <button onClick={withdraw} className="ml-auto primary-button">
                Withdraw Remaining
              </button>
            )}
          </div>
        )}
      </Panel>
    </>
  );
}

export default WithLayout(Stream);
