import { GroupVote } from '@celo/contractkit/lib/wrappers/Election';
import { PendingWithdrawal } from '@celo/contractkit/lib/wrappers/LockedGold';
import { ValidatorGroup } from '@celo/contractkit/lib/wrappers/Validators';
import { BigNumber } from 'bignumber.js';
import { CopyText, CustomSelectSearch, Panel, Table, toast } from 'components';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { useContractKit } from 'use-contractkit';
import {
  formatAmount,
  getValidatorGroupScore,
  toWei,
  truncate,
  truncateAddress,
} from 'utils';
import Web3 from 'web3';

interface AccountSummary {
  lockedGold: {
    total: BigNumber;
    nonvoting: BigNumber;
    requirement: BigNumber;
  };
  pendingWithdrawals: PendingWithdrawal[];
}

enum Status {
  Active = 'Active',
  Pending = 'Pending',
  Revoking = 'Revoking',
}

export default function Earn() {
  const { kit } = useContractKit();

  const [celo, setCelo] = useState(new BigNumber(0));
  const [accountSummary, setAccountSummary] = useState<AccountSummary>({
    lockedGold: {
      nonvoting: new BigNumber(0),
      total: new BigNumber(0),
      requirement: new BigNumber(0),
    },
    pendingWithdrawals: [],
  });
  const [groupVotes, setGroupVotes] = useState<GroupVote[]>([]);

  const [viewing, setViewing] = useState('');
  const [groups, setGroups] = useState<
    (ValidatorGroup & {
      score: BigNumber;
      totalVotes: BigNumber;
      electedCount: number;
    })[]
  >([]);
  const [lockAmount, setLockAmount] = useState('0');

  const [savingVote, setSavingVote] = useState(false);
  const [voteAmount, setVoteAmount] = useState('0');
  const [votingAddress, setVotingAddress] = useState('');

  const [totalVotes, setTotalVotes] = useState(new BigNumber(0));
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [sort, setSort] = useState({ property: 'totalVotes', desc: true });

  const sortFn = useCallback(
    (a, b) => {
      const propA = a[sort.property];
      const propB = b[sort.property];

      if (sort.desc) {
        return propB - propA;
      }
      return propA - propB;
    },
    [sort]
  );

  const fetchAccountSummary = useCallback(async () => {
    if (!kit.defaultAccount) {
      return;
    }

    const election = await kit.contracts.getElection();
    const votedForGroups = await election.getGroupsVotedForByAccount(
      kit.defaultAccount
    );
    setGroupVotes(
      await Promise.all(
        votedForGroups.map((groupAddress) =>
          election.getVotesForGroupByAccount(kit.defaultAccount, groupAddress)
        )
      )
    );

    const [locked, goldToken] = await Promise.all([
      kit.contracts.getLockedGold(),
      kit.contracts.getGoldToken(),
    ]);
    setAccountSummary(await locked.getAccountSummary(kit.defaultAccount));
    setCelo(await goldToken.balanceOf(kit.defaultAccount));
  }, [kit.defaultAccount]);

  const lock = useCallback(async () => {
    const lockedCelo = await kit.contracts.getLockedGold();
    await lockedCelo.lock().sendAndWaitForReceipt({ value: lockAmount });
  }, [kit, lockAmount]);

  const unlock = useCallback(async () => {
    const lockedCelo = await kit.contracts.getLockedGold();
    await lockedCelo.unlock(lockAmount).sendAndWaitForReceipt();
  }, [kit, lockAmount]);

  const withdraw = useCallback(
    async (value: number) => {
      const lockedCelo = await kit.contracts.getLockedGold();
      await lockedCelo.withdraw(value).sendAndWaitForReceipt();
    },
    [kit, fetchAccountSummary]
  );

  const activate = useCallback(async () => {
    try {
      const election = await kit.contracts.getElection();
      await Promise.all(
        (await election.activate(kit.defaultAccount)).map((tx) =>
          tx.sendAndWaitForReceipt()
        )
      );
      toast.success('Votes activated');
    } catch (e) {
      toast.error(`Unable to activate votes ${e.message}`);
    } finally {
      fetchAccountSummary();
    }
  }, [kit, fetchAccountSummary]);

  const vote = useCallback(
    async (address: string, value: string) => {
      setSavingVote(true);
      try {
        const election = await kit.contracts.getElection();
        await (
          await election.vote(address, new BigNumber(value))
        ).sendAndWaitForReceipt();
        toast.success('Vote cast');
        return true;
      } catch (e) {
        toast.error(`Unable to vote ${e.message}`);
        return false;
      } finally {
        setSavingVote(false);
        fetchAccountSummary();
      }
    },
    [kit, fetchAccountSummary]
  );

  const revoke = useCallback(
    async (address: string, value: string) => {
      setSavingVote(true);
      try {
        const election = await kit.contracts.getElection();
        await Promise.all(
          (
            await election.revoke(
              kit.defaultAccount,
              address,
              new BigNumber(value)
            )
          ).map((tx) => tx.sendAndWaitForReceipt())
        );
        toast.success('Vote cast');
        return true;
      } catch (e) {
        toast.error(`Unable to vote ${e.message}`);
        return false;
      } finally {
        setSavingVote(false);
        fetchAccountSummary();
      }
    },
    [kit, fetchAccountSummary]
  );

  const fetchValidators = useCallback(async () => {
    setLoading(true);
    const election = await kit.contracts.getElection();
    const validators = await kit.contracts.getValidators();
    setTotalVotes(await election.getTotalVotes());
    const registeredGroups = await validators.getRegisteredValidatorGroups();
    const groupsWithScore = await Promise.all(
      registeredGroups.map(async (g) => {
        let electedCount = 0;
        const totalVotes = await election.getTotalVotesForGroup(g.address);
        // @ts-ignore
        const score = await getValidatorGroupScore(kit, g.address);

        return {
          ...g,
          score,
          totalVotes,
          electedCount,
        };
      })
    );

    setGroups(groupsWithScore);
    setLoading(false);
  }, [kit]);

  useEffect(() => {
    fetchAccountSummary();
    fetchValidators();
  }, [fetchAccountSummary, fetchValidators]);

  const voting = accountSummary.lockedGold.total.minus(
    accountSummary.lockedGold.nonvoting
  );
  const total = accountSummary.lockedGold.total.plus(celo);
  const nonLocked = celo;

  const votingPct = voting.dividedBy(total).times(100);
  const nonvotingPct = accountSummary.lockedGold.nonvoting
    .dividedBy(accountSummary.lockedGold.total)
    .times(100);
  const notLockedPct = nonLocked.dividedBy(total).times(100);

  const votingPctStr = votingPct.isNaN() ? '0' : votingPct.toFixed(0);
  const nonvotingPctStr = nonvotingPct.isNaN() ? '0' : nonvotingPct.toFixed(0);
  const notLockedPctStr = notLockedPct.isNaN() ? '0' : notLockedPct.toFixed(0);

  console.log('>>>', groups);

  return (
    <>
      <Panel>
        <div>
          <div className="text-gray-200 text-xl font-medium">
            Earn with CELO
          </div>
          <p className="text-gray-400 text-xs md:text-sm mt-2">
            Staking your CELO is a great way to earn passive rewards. To begin
            staking you first need to lock your CELO, then you're free to vote
            for validator groups of your choosing.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row space-y-1 md:space-y-0 md:space-x-3 items-end justify-end">
            <span
              style={{ width: 'fit-content' }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-no-wrap"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-green-400"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Voting ({votingPctStr}%)
            </span>

            <span
              style={{ width: 'fit-content' }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-no-wrap"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-400"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Locked ({nonvotingPctStr}%)
            </span>

            <span
              style={{ width: 'fit-content' }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 text-gray-900 whitespace-no-wrap"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-900"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Not Locked ({notLockedPctStr}%)
            </span>
          </div>
          <div className="bg-gray-600 w-full flex rounded h-2">
            <div
              id="voting"
              className="bg-green-700 rounded-l"
              style={{ width: `${votingPctStr}%` }}
            ></div>
            <div
              id="locked"
              className="bg-gray-400"
              style={{ width: `${nonvotingPctStr}%` }}
            ></div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="md:grid md:grid-cols-4 md:gap-6 py-2">
          <div className="md:col-span-1">
            <h3 className="text-xl font-medium leading-6 text-gray-200">
              Lock
            </h3>
          </div>
          <div className="mt-2 md:mt-0 md:col-span-3">
            <div className="flex flex-col space-y-4">
              <div className="text-gray-400 text-sm">
                {truncateAddress(kit.defaultAccount || '0x')} currently has{' '}
                <span className="font-medium text-gray-200">
                  {formatAmount(accountSummary.lockedGold.total, 2)}
                </span>{' '}
                out of{' '}
                <span className="text-gray-200">{formatAmount(total, 0)}</span>{' '}
                ({parseFloat(votingPctStr) + parseFloat(nonvotingPctStr)}%) CELO
                locked for voting. Lock or unlock more for access to more
                rewards.{' '}
              </div>
              <div>
                <div className="flex">
                  <span className="hidden sm:inline-flex mx-auto flex-row items-center space-x-3 min-w-0">
                    <button className="secondary-button" onClick={unlock}>
                      Unlock
                    </button>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        type="text"
                        value={lockAmount}
                        onChange={(e) => setLockAmount(e.target.value)}
                        className="appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-80"
                        placeholder={'0'}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <div className="flex items-center justify-center focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-4 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md">
                          CELO
                        </div>
                      </div>
                    </div>
                    <button className="secondary-button" onClick={lock}>
                      Lock
                    </button>
                  </span>
                </div>

                <span className="flex sm:hidden flex-col">
                  <div className="mt-1 relative rounded-md shadow-sm w-full">
                    <input
                      type="text"
                      value={lockAmount}
                      onChange={(e) => setLockAmount(e.target.value)}
                      className="appearance-none block px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-full"
                      placeholder={'0'}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <div className="flex items-center justify-center focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-4 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md">
                        CELO
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4 justify-center items-center">
                    <button className="secondary-button" onClick={unlock}>
                      Unlock
                    </button>
                    <button className="secondary-button" onClick={lock}>
                      Lock
                    </button>
                  </div>
                </span>
                <div className="flex text-gray-400 text-xs justify-center mt-2">
                  {toWei(lockAmount)} CELO (Wei)
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
      <Panel>
        <div className="md:grid md:grid-cols-4 md:gap-6 py-2">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-200">
              Vote
            </h3>
          </div>
          <div className="mt-2 md:mt-0 md:col-span-3">
            <div className="space-y-6">
              <div className="text-gray-400 mb-2 text-sm">
                {truncateAddress(kit.defaultAccount || '0x')} currently has{' '}
                <span className="font-medium text-gray-200">
                  {formatAmount(accountSummary.lockedGold.total, 2)} CELO
                </span>{' '}
                ({parseFloat(votingPctStr) + parseFloat(nonvotingPctStr)}%)
                locked for voting.{' '}
                <span className="font-medium text-gray-200">
                  {formatAmount(accountSummary.lockedGold.nonvoting, 2)}
                </span>{' '}
                ({nonvotingPctStr}%) of that CELO is free for voting.
              </div>

              <div>
                <ul className="list-decimal list-inside">
                  {groupVotes.map((gv) => {
                    const group = groups.find((g) => g.address === gv.group);
                    if (!group) {
                      return null;
                    }
                    return (
                      <li className="flex items-center mb-3">
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-gray-300 text-sm">
                              {truncate(group.name, 30)}
                            </span>
                            <span className="text-gray-400 text-sm flex space-x-2">
                              <span>({truncateAddress(group.address)})</span>
                              <CopyText text={group.address} />
                            </span>
                          </div>
                          {gv.active && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium text-green-600">
                              {formatAmount(gv.active, 2)} (
                              {gv.active
                                .dividedBy(accountSummary.lockedGold.total)
                                .times(100)
                                .toFixed(0)}
                              )%
                            </span>
                          )}
                        </div>

                        <div className="ml-auto">
                          {gv.active && (
                            <button
                              className="text-gray-300 text-sm hover:text-gray-400"
                              onClick={() =>
                                revoke(gv.group, gv.active.toString())
                              }
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {adding ? (
                  <div className="mt-4">
                    <div className="flex flex-col md:flex-row md:space-x-4 items-center">
                      <CustomSelectSearch
                        options={groups.map((vg) => ({
                          ...vg,
                          value: vg.address,
                          name: `${truncate(vg.name, 10)} (${truncateAddress(
                            vg.address
                          )})`,
                        }))}
                        placeholder="Choose a validator group"
                        value={votingAddress}
                        onChange={(a) => setVotingAddress(a)}
                      />

                      <div className="relative rounded-md shadow-sm mt-4 md:mt-0 w-full">
                        <input
                          type="text"
                          name="price"
                          id="price"
                          value={voteAmount}
                          onChange={(e) => setVoteAmount(e.target.value)}
                          // className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-12 sm:text-sm border-gray-300 rounded-md"
                          className="appearance-none block pl-3 pr-16 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-full"
                          placeholder={'0'}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center">
                          <div className="flex items-center justify-center focus:ring-indigo-500 focus:border-indigo-500 h-full py-0 pl-2 pr-4 border-transparent bg-transparent text-gray-300 sm:text-sm rounded-md">
                            CELO
                          </div>
                        </div>
                      </div>

                      {savingVote ? (
                        <span className="px-6 py-2">
                          <Loader type="TailSpin" height={20} width={20} />
                        </span>
                      ) : (
                        <button
                          className="secondary-button"
                          onClick={async () => {
                            if (await vote(votingAddress, voteAmount)) {
                              setVotingAddress('');
                              setVoteAmount('0');
                              setAdding(false);
                            }
                          }}
                        >
                          Vote
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-right text-gray-400 mt-1">
                      Staking{' '}
                      <span className="text-gray-200">
                        {toWei(voteAmount)} CELO (Wei)
                      </span>{' '}
                      with{' '}
                      <span className="text-gray-200">
                        {truncate(
                          groups.find((vg) => vg.address === votingAddress)
                            ?.name || '',
                          10
                        )}{' '}
                        {truncateAddress(votingAddress)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAdding(true)}
                    className="rounded-md px-4 py-1 text-gray-300 text-sm font-medium bg-gray-700 hover:bg-gray-750"
                  >
                    New vote
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Elected validator groups
          </h3>
          <p className="text-gray-400 mt-2 text-sm">
            Take a look at the below validator groups before voting to have a
            more informed choice. More information around what you should be
            looking for in a validator group can be found in the{' '}
            <a
              className="text-blue-500"
              target="_blank"
              href="https://docs.celo.org/celo-owner-guide/voting-validators"
            >
              Voting for Validator Groups
            </a>{' '}
            guide.
          </p>
        </div>

        <div className="-mx-5">
          <Table
            headers={[
              { displayName: 'Name', sortableProperty: 'name' },
              { displayName: 'Total votes', sortableProperty: 'totalVotes' },
              { displayName: 'Score', sortableProperty: 'score' },
              'Elected',
              '',
            ]}
            onHeaderClick={(property, desc) => {
              setSort({ property, desc });
            }}
            sort={sort}
            loading={loading}
            noDataMessage="No validator groups found"
            rows={groups.sort(sortFn).map((g) => [
              <div>
                {!g.name ? (
                  <span className="italic">{truncateAddress(g.address)}</span>
                ) : (
                  truncate(g.name, 20)
                )}
              </div>,
              <div className="text=gray-300">
                {Web3.utils.fromWei(g.totalVotes.toFixed(0)).split('.')[0]} (
                {g.totalVotes.dividedBy(totalVotes).times(100).toFixed(0)}%)
              </div>,
              <div>{g.score.times(100).toFixed(2)}%</div>,
              <div>
                {g.electedCount} / {g.members.length}
              </div>,
              <div></div>,
            ])}
          />
        </div>
      </Panel>
    </>
  );
}
