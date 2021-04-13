import { useContractKit } from '@celo-tools/use-contractkit';
import { ContractKit } from '@celo/contractkit';
import { GroupVote } from '@celo/contractkit/lib/wrappers/Election';
import { ValidatorGroup } from '@celo/contractkit/lib/wrappers/Validators';
import { BigNumber } from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import Web3 from 'web3';
import {
  CopyText,
  CustomSelectSearch,
  LockCelo,
  Panel,
  PanelDescription,
  PanelGrid,
  PanelHeader,
  Table,
  toast,
  TokenInput,
} from '../components';
import { Celo } from '../constants';
import { Base } from '../state';
import { formatAmount, truncate, truncateAddress } from '../utils';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
  Voting,
}

export async function getValidatorGroupScore(
  kit: ContractKit,
  groupAddress: string,
  electedValidators: any[]
) {
  const validators = await kit.contracts.getValidators();
  const group = await validators.getValidatorGroup(groupAddress, false);

  let totalScore = new BigNumber(0);
  let electedCount = 0;
  group.members.forEach((address) => {
    const v = electedValidators.find((ev) => ev.address === address);
    if (v) {
      totalScore = totalScore.plus(v.score);
      electedCount++;
    }
  });

  const score =
    electedCount === 0 || totalScore.eq(0)
      ? new BigNumber(0)
      : totalScore.dividedBy(electedCount);
  return { score, electedCount };
}

export function Earn() {
  const { kit, performActions, address } = useContractKit();
  const {
    lockedSummary,
    fetchLockedSummary,
    balances,
    track,
  } = Base.useContainer();

  const [groupVotes, setGroupVotes] = useState<GroupVote[]>([]);
  const [hasActivatablePendingVotes, setHasActivatablePendingVotes] = useState(
    false
  );
  const [state, setState] = useState(States.None);

  const [groups, setGroups] = useState<
    (ValidatorGroup & {
      score: BigNumber;
      totalVotes: BigNumber;
      electedCount: number;
    })[]
  >([]);
  const [voteAmount, setVoteAmount] = useState('');
  const [votingName, setVotingName] = useState('');
  const [votingAddress, setVotingAddress] = useState('');

  const [totalVotes, setTotalVotes] = useState(new BigNumber(0));
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const [sort, setSort] = useState({ property: 'score', desc: true });

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

  const activate = async () => {
    track('stake/activate');
    setState(States.Activating);
    try {
      await performActions(async (k) => {
        console.log(k);
        const election = await k.contracts.getElection();
        await Promise.all(
          (await election.activate(address)).map((tx) =>
            tx.sendAndWaitForReceipt({ from: address })
          )
        );
      });
      toast.success('Votes activated');
    } catch (e) {
      toast.error(`Unable to activate votes ${e.message}`);
    }
    fetchVotingSummary();
    fetchLockedSummary();
    setState(States.None);
  };

  const vote = async () => {
    if (!votingAddress) {
      toast.error('Please select a validator group');
      return;
    }

    if (!voteAmount) {
      toast.error('Please enter an amount to stake');
      return;
    }

    track('stake/vote', { address: votingAddress, value: voteAmount });
    setState(States.Voting);
    try {
      await performActions(async (k) => {
        const election = await k.contracts.getElection();
        await (
          await election.vote(
            votingAddress,
            new BigNumber(Web3.utils.toWei(voteAmount))
          )
        ).sendAndWaitForReceipt({ from: address });
      });
      toast.success('Vote cast');

      setVoteAmount('');
      setVotingAddress('');
      setVotingName('');
    } catch (e) {
      toast.error(`Unable to vote ${e.message}`);
    } finally {
      setState(States.None);
      fetchLockedSummary();
      fetchVotingSummary();
    }
  };

  const revoke = async (groupAddress: string, value: string) => {
    track('stake/revoke', { address, value });
    setState(States.Revoking);
    try {
      await performActions(async (k) => {
        const election = await k.contracts.getElection();
        await Promise.all(
          (
            await election.revoke(address, groupAddress, new BigNumber(value))
          ).map((tx) => tx.sendAndWaitForReceipt({ from: address }))
        );
      });
      toast.success('Vote cast');
    } catch (e) {
      toast.error(`Unable to vote ${e.message}`);
    } finally {
      setState(States.None);
      fetchVotingSummary();
      fetchLockedSummary();
    }
  };

  const fetchVotingSummary = useCallback(async () => {
    if (!address) {
      return;
    }

    const election = await kit.contracts.getElection();
    const votedForGroups = await election.getGroupsVotedForByAccount(address);

    setGroupVotes(
      await Promise.all(
        votedForGroups.map((groupAddress) =>
          election.getVotesForGroupByAccount(address, groupAddress)
        )
      )
    );

    setHasActivatablePendingVotes(
      await election.hasActivatablePendingVotes(address)
    );
  }, [kit, address]);

  const fetchValidators = useCallback(async () => {
    setLoading(true);

    const election = await kit.contracts.getElection();
    const validators = await kit.contracts.getValidators();

    setTotalVotes(await election.getTotalVotes());

    const registeredGroups = await validators.getRegisteredValidatorGroups();
    const electedValidatorSigners = await election.getCurrentValidatorSigners();

    const electedValidators = await Promise.all(
      electedValidatorSigners.map(async (signer) => {
        const account = await validators.signerToAccount(signer);
        return validators.getValidator(account);
      })
    );

    const groupsWithScore = await Promise.all(
      registeredGroups.map(async (g) => {
        const totalVotes = await election.getTotalVotesForGroup(g.address);
        const { score, electedCount } = await getValidatorGroupScore(
          // @ts-ignore
          kit,
          g.address,
          electedValidators
        );

        return {
          ...g,
          score,
          electedCount,
          totalVotes,
        };
      })
    );

    setGroups(groupsWithScore);
    setLoading(false);
  }, [kit]);

  useEffect(() => {
    fetchVotingSummary();
  }, [fetchVotingSummary]);

  useEffect(() => {
    fetchValidators();
  }, [fetchValidators]);

  const voting = lockedSummary.lockedGold.total.minus(
    lockedSummary.lockedGold.nonvoting
  );
  const total = lockedSummary.lockedGold.total.plus(balances.CELO);
  const nonLocked = balances.CELO;

  const votingPct = voting.dividedBy(total).times(100);
  const nonvotingPct = lockedSummary.lockedGold.nonvoting
    .dividedBy(lockedSummary.lockedGold.total)
    .times(100);
  const notLockedPct = nonLocked.dividedBy(total).times(100);

  const votingPctStr = votingPct.isNaN() ? '0' : votingPct.toFixed(0);
  const nonvotingPctStr = nonvotingPct.isNaN() ? '0' : nonvotingPct.toFixed(0);
  const notLockedPctStr = notLockedPct.isNaN() ? '0' : notLockedPct.toFixed(0);

  return (
    <>
      <Panel>
        <div>
          <div className="text-gray-900 dark:text-gray-200 text-xl font-medium">
            Earn with CELO
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mt-2">
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
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-400 dark:bg-gray-100 text-gray-800 whitespace-no-wrap"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-600 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Locked ({nonvotingPctStr}%)
            </span>

            <span
              style={{ width: 'fit-content' }}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-400 text-gray-900 whitespace-no-wrap"
            >
              <svg
                className="-ml-0.5 mr-1.5 h-2 w-2 text-gray-600 dark:text-gray-900"
                fill="currentColor"
                viewBox="0 0 8 8"
              >
                <circle cx={4} cy={4} r={3} />
              </svg>
              Not Locked ({notLockedPctStr}%)
            </span>
          </div>
          <div className="bg-gray-200 w-full flex rounded h-2">
            <div
              id="voting"
              className="bg-green-300 dark:bg-green-700 rounded-l"
              style={{ width: `${votingPctStr}%` }}
            ></div>
            <div
              id="locked"
              className="bg-gray-400 dark:bg-gray-400"
              style={{ width: `${nonvotingPctStr}%` }}
            ></div>
          </div>
        </div>
      </Panel>

      <LockCelo />

      <Panel>
        <PanelGrid>
          <div>
            <PanelHeader>Vote</PanelHeader>
            <PanelDescription></PanelDescription>
          </div>

          <>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {truncateAddress(address || '0x')} currently has{' '}
              <span className="font-medium text-gray-900 dark:text-gray-200">
                {formatAmount(lockedSummary.lockedGold.nonvoting)}
              </span>{' '}
              ({nonvotingPctStr}%) CELO locked and ready to vote with.
            </div>

            <div className="text-gray-600 dark:text-gray-400 text-sm">
              After voting for any group there is a{' '}
              <span className="text-gray-900 dark:text-gray-200 font-medium">
                24
              </span>{' '}
              hour waiting period you must observe before activating your votes.
              Please ensure you check back here to activate any votes and start
              earning rewards.
            </div>

            {hasActivatablePendingVotes && (
              <div className="flex">
                <button onClick={activate} className="ml-auto secondary-button">
                  Activate All Pending Votes
                </button>
              </div>
            )}

            <div>
              <ul className="list-decimal list-inside">
                {groupVotes.map((gv) => {
                  const group = groups.find((g) => g.address === gv.group);
                  if (!group) {
                    return null;
                  }
                  return (
                    <li className="flex flex-col mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {truncate(group.name, 30)}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm inline-flex space-x-1">
                          <span>({truncateAddress(group.address)})</span>
                          <CopyText text={group.address} />
                        </span>
                      </div>

                      <div className="relative flex flex-col mt-2">
                        <span className="inline-flex items-center rounded-md text-xs font-medium text-indigo-600">
                          {formatAmount(gv.active)} ACTIVE (
                          {gv.active
                            .dividedBy(lockedSummary.lockedGold.total)
                            .times(100)
                            .toFixed(0)}
                          )%
                        </span>
                        <span className="inline-flex items-center rounded-md text-xs font-medium text-blue-600 mt-1">
                          {formatAmount(gv.pending)} PENDING (
                          {gv.pending
                            .dividedBy(lockedSummary.lockedGold.total)
                            .times(100)
                            .toFixed(0)}
                          )%
                        </span>
                        <div className="absolute right-0 top-0">
                          {gv.active && (
                            <>
                              {state === States.Revoking ? (
                                <Loader
                                  type="TailSpin"
                                  color="white"
                                  height={'12px'}
                                  width="12px"
                                />
                              ) : (
                                <button
                                  className=" text-sm hover:text-gray-600 dark:text-gray-400"
                                  onClick={() =>
                                    revoke(gv.group, gv.active.toString())
                                  }
                                >
                                  Revoke
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {adding ? (
                <div className="mt-4">
                  <div className="flex flex-col md:flex-row md:space-x-4 items-center">
                    <div className="hidden sm:flex w-full">
                      <CustomSelectSearch
                        options={groups.map((vg) => ({
                          value: vg.address,
                          name: `${vg.name} (${truncateAddress(vg.address)})`,
                        }))}
                        placeholder="Choose a validator group"
                        value={votingAddress}
                        onChange={(a) => {
                          setVotingAddress(a);
                        }}
                      />
                    </div>
                    <div className="flex sm:hidden w-full">
                      <select
                        className="py-2 dark:bg-gray-750 rounded-md border border-gray-300 dark:border-gray-500 w-full"
                        value={votingName}
                        onChange={(e) => {
                          const address = e.target[
                            e.target.selectedIndex
                          ].getAttribute('data-address');
                          setVotingName(e.target.value);
                          setVotingAddress(address);
                        }}
                      >
                        <option value="" disabled selected hidden>
                          Please choose a validator group...
                        </option>

                        {groups.map((g) => (
                          <option
                            data-address={g.address}
                            value={`${truncate(g.name, 20)} (${truncateAddress(
                              g.address
                            )})`}
                          >
                            {`${truncate(g.name, 20)} (${truncateAddress(
                              g.address
                            )})`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 md:mt-0 w-full">
                      <TokenInput
                        value={voteAmount}
                        onChange={(e) => setVoteAmount(e)}
                        max={formatAmount(lockedSummary.lockedGold.nonvoting)}
                        token={Celo}
                      />
                    </div>

                    {state === States.Voting ? (
                      <span className="px-6 py-2">
                        <Loader type="TailSpin" height={20} width={20} />
                      </span>
                    ) : (
                      <button className="secondary-button" onClick={vote}>
                        Vote
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <button
                    onClick={() => setAdding(true)}
                    className="ml-auto rounded-md px-4 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-750 transition"
                  >
                    New vote
                  </button>
                </div>
              )}
            </div>
          </>
        </PanelGrid>
      </Panel>

      <Panel>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
            Elected validator groups
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
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
            ])}
          />
        </div>
      </Panel>
    </>
  );
}
