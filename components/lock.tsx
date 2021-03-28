import { formatAmount, toWei, truncateAddress } from 'utils';
import { Panel } from './panel';
import { useContractKit } from '@celo-tools/use-contractkit';
import { Base } from 'state';
import { useCallback, useState } from 'react';
import { toast } from 'components';
import Loader from 'react-loader-spinner';
import { Input } from './input';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
}

export function LockCelo() {
  const { address, kit, send } = useContractKit();
  const { accountSummary, lockedSummary, balances } = Base.useContainer();
  const [lockAmount, setLockAmount] = useState('');
  const [state, setState] = useState(States.None);

  const lock = useCallback(async () => {
    setState(States.Locking);
    try {
      const lockedCelo = await kit.contracts.getLockedGold();
      await send(lockedCelo.lock(), { value: toWei(lockAmount) });
      toast.success('CELO locked');
      setLockAmount('0');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  }, [kit, send, lockAmount]);

  const unlock = useCallback(async () => {
    setState(States.Unlocking);
    try {
      const lockedCelo = await kit.contracts.getLockedGold();
      await send(lockedCelo.unlock(toWei(lockAmount)));
      toast.success('CELO unlocked');
      setLockAmount('');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  }, [kit, send, lockAmount]);

  const total = lockedSummary.lockedGold.total.plus(balances.CELO);
  const lockedPct = lockedSummary.lockedGold.total
    .dividedBy(total)
    .times(100)
    .toFixed(2);

  return (
    <Panel>
      <div className="md:grid md:grid-cols-4 md:gap-6 py-2">
        <div className="md:col-span-1">
          <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-gray-200">
            Lock CELO
          </h3>
        </div>
        <div className="mt-2 md:mt-0 md:col-span-3">
          <div className="flex flex-col space-y-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {truncateAddress(address || '0x')} currently has{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {formatAmount(lockedSummary.lockedGold.total)}
              </span>{' '}
              out of{' '}
              <span className="text-gray-900 dark:text-gray-200">
                {formatAmount(total)}
              </span>{' '}
              ({parseFloat(lockedPct)}%) CELO locked for voting.
            </div>
            <div>
              <span className="flex flex-col">
                <div className="w-full md:w-96 md:mx-auto">
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <Input
                      type="text"
                      value={lockAmount}
                      onChange={(e) => setLockAmount(e.target.value)}
                      placeholder={'0'}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <div className="flex items-center justify-center focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-4 border-transparent bg-transparent  sm:text-sm rounded-md">
                        CELO
                      </div>
                    </div>
                  </div>
                  <div className="flex text-gray-600 dark:text-gray-400 text-xs mt-2">
                    {toWei(lockAmount || '0')} CELO (Wei)
                  </div>
                </div>
                {state === States.Locking || state === States.Unlocking ? (
                  <div className="flex items-center justify-center mt-3">
                    <Loader
                      type="TailSpin"
                      color="white"
                      height="24px"
                      width="24px"
                    />
                  </div>
                ) : (
                  <>
                    <div className="flex space-x-4 justify-center items-center">
                      <button className="secondary-button" onClick={unlock}>
                        Unlock
                      </button>
                      <button className="secondary-button" onClick={lock}>
                        Lock
                      </button>
                    </div>
                  </>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}
