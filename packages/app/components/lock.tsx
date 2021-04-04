import { formatAmount, plausible, toWei, truncateAddress } from '../utils';
import { Panel, PanelGrid, PanelHeader } from './panel';
import { useContractKit } from '@celo-tools/use-contractkit';
import { Base } from '../state';
import { useCallback, useState } from 'react';
import { toast } from '../components';
import Loader from 'react-loader-spinner';
import { Input, TokenInput } from './input';
import { Celo } from '../constants';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
}

export function LockCelo() {
  const { address, kit, performActions } = useContractKit();
  const { accountSummary, lockedSummary, balances } = Base.useContainer();
  const [lockAmount, setLockAmount] = useState('');
  const [state, setState] = useState(States.None);

  const lock = async () => {
    plausible('lock', { amount: toWei(lockAmount) });
    setState(States.Locking);
    try {
      await performActions(async (k) => {
        const lockedCelo = await k.contracts.getLockedGold();
        return lockedCelo
          .lock()
          .sendAndWaitForReceipt({ value: toWei(lockAmount), from: address });
      });
      toast.success('CELO locked');
      setLockAmount('');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  };

  const unlock = async () => {
    plausible('unlock', { amount: toWei(lockAmount) });

    setState(States.Unlocking);
    try {
      await performActions(async (k) => {
        const lockedCelo = await k.contracts.getLockedGold();
        await lockedCelo
          .unlock(toWei(lockAmount))
          .sendAndWaitForReceipt({ from: address });
      });
      toast.success('CELO unlocked');
      setLockAmount('');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  };

  const total = lockedSummary.lockedGold.total.plus(balances.CELO);
  const lockedPct = lockedSummary.lockedGold.total
    .dividedBy(total)
    .times(100)
    .toFixed(2);

  return (
    <Panel>
      <PanelGrid>
        <PanelHeader>Lock CELO</PanelHeader>
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
                <TokenInput
                  value={lockAmount}
                  onChange={(e) => setLockAmount(e)}
                  token={Celo}
                  max={balances[Celo.ticker].toString()}
                />
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
      </PanelGrid>
    </Panel>
  );
}
