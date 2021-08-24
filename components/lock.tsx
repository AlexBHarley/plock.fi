import { useContractKit } from '@celo-tools/use-contractkit';
import { useState } from 'react';
import Loader from 'react-loader-spinner';
import { toast } from '../components';
import { Celo } from '../constants';
import { Base } from '../state';
import { formatAmount, toWei, truncateAddress } from '../utils';
import { ensureAccount } from '../utils/ensure-account';
import { TokenInput } from './input';
import { Panel, PanelDescription, PanelGrid, PanelHeader } from './panel';
import { Bold, Link } from './text';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
  Withdrawing,
}

export function LockCelo() {
  const { address, performActions } = useContractKit();
  const {
    lockedSummary,
    balances,
    track,
    fetchLockedSummary,
  } = Base.useContainer();
  const [lockAmount, setLockAmount] = useState('');
  const [state, setState] = useState(States.None);

  const lock = async () => {
    track('lock/lock', { amount: toWei(lockAmount) });
    setState(States.Locking);

    try {
      await performActions(async (k) => {
        await ensureAccount(k, k.defaultAccount);
        const lockedCelo = await k.contracts.getLockedGold();
        return lockedCelo.lock().sendAndWaitForReceipt({
          value: toWei(lockAmount),
          from: k.defaultAccount,
        });
      });
      fetchLockedSummary();
      toast.success('CELO locked');
      setLockAmount('');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  };

  const unlock = async () => {
    track('lock/unlock', { amount: toWei(lockAmount) });

    setState(States.Unlocking);
    try {
      await performActions(async (k) => {
        const lockedCelo = await k.contracts.getLockedGold();
        await lockedCelo
          .unlock(toWei(lockAmount))
          .sendAndWaitForReceipt({ from: k.defaultAccount });
      });
      fetchLockedSummary();
      toast.success('CELO unlocked');
      setLockAmount('');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  };

  const withdraw = async () => {
    track('lock/withdraw', { amount: toWei(lockAmount) });

    setState(States.Withdrawing);
    try {
      await performActions(async (k) => {
        const locked = await k.contracts.getLockedGold();
        const currentTime = Math.round(new Date().getTime() / 1000);
        while (true) {
          let madeWithdrawal = false;
          const pendingWithdrawals = await locked.getPendingWithdrawals(
            address
          );
          for (let i = 0; i < pendingWithdrawals.length; i++) {
            const pendingWithdrawal = pendingWithdrawals[i];
            if (pendingWithdrawal.time.isLessThan(currentTime)) {
              await locked
                .withdraw(i)
                .sendAndWaitForReceipt({ from: k.defaultAccount });
              madeWithdrawal = true;
              break;
            }
          }
          if (!madeWithdrawal) {
            break;
          }
        }
      });
      fetchLockedSummary();
      toast.success('CELO withdrawn');
    } catch (e) {
      toast.error(e.message);
    }
    setState(States.None);
  };

  const total = lockedSummary.total.plus(balances.CELO);
  const lockedPct = lockedSummary.total.dividedBy(total).times(100).toFixed(2);

  return (
    <Panel>
      <PanelGrid>
        <PanelHeader>Lock CELO</PanelHeader>

        <div className="flex flex-col space-y-4">
          <PanelDescription>
            <p>
              When locking CELO it's important to note that there are a few
              states your CELO can be in, not locked, locked, unlocking and
              withdrawable. For a deep dive into each of these states, checkout
              the{' '}
              <Link link="https://docs.celo.org/celo-codebase/protocol/proof-of-stake/locked-gold">
                Locked Celo documentation
              </Link>
              .
            </p>

            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {truncateAddress(address || '0x')} currently has{' '}
              <Bold>{formatAmount(lockedSummary.total)}</Bold> out of{' '}
              <Bold>{formatAmount(total)}</Bold> ({parseFloat(lockedPct) || 0}%)
              CELO locked for voting.{' '}
              <Bold>{formatAmount(lockedSummary.unlocking)}</Bold> CELO is
              currently unlocking and{' '}
              <Bold>{formatAmount(lockedSummary.withdrawable)}</Bold> CELO is
              withdrawable.
            </p>
          </PanelDescription>
          <div>
            <span className="flex flex-col">
              <div className="w-full md:w-96 md:mx-auto">
                <TokenInput
                  value={lockAmount}
                  onChange={(e) => setLockAmount(e)}
                  token={Celo}
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
                <div className="flex space-x-4 justify-center items-center">
                  <button className="secondary-button" onClick={unlock}>
                    Unlock
                  </button>
                  <button className="secondary-button" onClick={lock}>
                    Lock
                  </button>
                </div>
              )}

              {lockedSummary.withdrawable.gt(0) && (
                <div className="flex">
                  <button
                    className="secondary-button ml-auto"
                    onClick={withdraw}
                  >
                    Withdraw Locked CELO
                  </button>
                </div>
              )}
            </span>
          </div>
        </div>
      </PanelGrid>
    </Panel>
  );
}
