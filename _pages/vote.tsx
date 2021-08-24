import { useContractKit } from '@celo-tools/use-contractkit';
import {
  Link,
  LockCelo,
  Panel,
  PanelDescription,
  PanelGrid,
  PanelHeader,
  Table,
  toast,
  WithLayout,
} from '../components';
import { useCallback, useEffect, useState } from 'react';
import { ImArrowDown, ImArrowUp } from 'react-icons/im';
import { FiExternalLink } from 'react-icons/fi';
import {
  ProposalStage,
  VoteValue,
} from '@celo/contractkit/lib/wrappers/Governance';

import Countdown from 'react-countdown';
import BigNumber from 'bignumber.js';
import { Base } from '../state';

export function Vote() {
  const { kit, performActions, address } = useContractKit();
  const { track } = Base.useContainer();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const governance = await kit.contracts.getGovernance();
    const dequeue = await governance.getDequeue();
    const queue = await governance.getQueue();

    const records = await Promise.all(
      dequeue.map(async (id) => {
        const isExpired = await governance.isDequeuedProposalExpired(id);
        const support = await governance.getSupport(id);

        const percentage = support.total.div(support.required).times(100);
        const percentageFixed = percentage.isFinite()
          ? percentage.toFixed(0)
          : new BigNumber(100).toFixed(0);

        const record = await governance.getProposalRecord(id);
        if (record.stage === ProposalStage.None) {
          return null;
        }

        const {
          Referendum,
          Execution,
          Approval,
          Expiration,
        } = await governance.proposalSchedule(id);

        let nextStageTime;
        [Approval, Referendum, Execution, Expiration].forEach((bn) => {
          const date = bn.toNumber() * 1000;
          const diff = date - Date.now();

          if (!nextStageTime) {
            nextStageTime = date;
          }

          if (diff < 0) {
            return;
          }

          if (nextStageTime && date < nextStageTime) {
            nextStageTime = date;
            return;
          }

          nextStageTime = date;
        });
        if (!nextStageTime) {
          return null;
        }

        const voteRecord = await governance.getVoteRecord(
          kit.defaultAccount,
          id
        );

        const isPassing = await governance.isProposalPassing(id);
        const isApproved = await governance.isApproved(id);

        return {
          id: id,
          isExpired,
          isPassing,
          isApproved,
          proposal: record,
          vote: voteRecord ? voteRecord.value : 'None',
          nextStageTime,
          percentage: percentageFixed,
        };
      })
    );
    setProposals(
      records.filter(Boolean).sort((a, b) => b.id.minus(a.id).toNumber())
    );
    setLoading(false);
  }, [kit]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const upvote = async (id: string) => {
    track('vote/upvote', { id });
    try {
      await performActions(async (k) => {
        const governance = await k.contracts.getGovernance();
        await (
          await governance.upvote(id, k.defaultAccount)
        ).sendAndWaitForReceipt({
          from: k.defaultAccount,
        });
      });
      toast.success('Approved');
      fetchProposals();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const vote = async (id: string, value: VoteValue) => {
    track('vote/vote', { id, value });
    try {
      await performActions(async (k) => {
        const governance = await k.contracts.getGovernance();
        const voteRecord = await governance.getVoteRecord(address, id);

        let safeValue = value;
        if (voteRecord.value === value) {
          safeValue = VoteValue.Abstain;
        }

        await (
          await governance.vote(id, safeValue as any)
        ).sendAndWaitForReceipt({ from: k.defaultAccount });
      });

      toast.success('Vote cast');
      fetchProposals();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Panel>
        <div>
          <PanelHeader>Governance</PanelHeader>
          <PanelDescription>
            <p>
              Celo uses a formal on-chain governance mechanism to manage and
              upgrade the protocol, you can have your say in these changes by{' '}
              <Link link="https://docs.celo.org/celo-owner-guide/voting-governance">
                voting on proposals
              </Link>
              . More information around voting can be found in the{' '}
              <Link link="https://docs.celo.org/celo-codebase/protocol/governance">
                Celo Governance documentation
              </Link>
              .
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              As with voting for validator groups (or staking), you need to lock
              Celo before voting on active proposals.
            </p>
          </PanelDescription>
        </div>
      </Panel>

      <LockCelo />

      <Panel>
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
          Proposals
        </h3>
        <div className="-mx-5">
          <Table
            headers={['', 'ID', 'Stage', 'Status', 'Description']}
            loading={loading}
            noDataMessage="No proposals found"
            rows={proposals.map((p) => {
              let upvoteClass = '';
              let downVoteClass = '';
              if (p.vote === 'None' || p.vote === 'Abstain') {
                upvoteClass = 'text-gray-500';
                downVoteClass = 'text-gray-500';
              }
              if (p.vote === 'No') {
                upvoteClass = 'text-gray-500';
                downVoteClass = 'text-red-500';
              }
              if (p.vote === 'Yes') {
                upvoteClass = 'text-green-500';
                downVoteClass = 'text-gray-500';
              }

              let status;
              let statusClassName;
              if (p.proposal.stage === 'Proposal') {
                status = '';
              } else if (p.proposal.stage === 'Approval') {
                status = p.isApproved ? 'Approved' : 'Not approved';
                statusClassName = p.isApproved
                  ? 'border rounded px-2 py-1 border-green-500 text-green-500'
                  : 'border rounded px-2 py-1 border-red-500 text-red-500';
              } else if (p.proposal.stage === 'Referendum') {
                status = p.isPassing ? 'Passing' : 'Not passing';
                statusClassName = p.isPassing
                  ? 'border rounded px-2 py-1 border-green-500 text-green-500'
                  : 'border rounded px-2 py-1 border-red-500 text-red-500';
              } else if (p.proposal.stage === 'Execution') {
              } else if (p.proposal.stage === 'Expiration') {
                status = p.isApproved ? 'Executed' : 'Not executed';
                statusClassName = p.isApproved
                  ? 'border rounded px-2 py-1 border-green-500 text-green-500'
                  : 'border rounded px-2 py-1 border-red-500 text-red-500';
              }

              return [
                <span
                  className="inline-flex text-gray-500 space-x-3"
                  style={{ width: 'fit-content' }}
                >
                  {p.proposal.stage === 'Proposal' && (
                    <button
                      className={upvoteClass}
                      onClick={() => upvote(p.id)}
                    >
                      <ImArrowUp />
                    </button>
                  )}
                  {p.proposal.stage === 'Referendum' && (
                    <>
                      <button
                        className={upvoteClass}
                        onClick={() => vote(p.id, VoteValue.Yes)}
                      >
                        <ImArrowUp />
                      </button>
                      <button
                        className={downVoteClass}
                        onClick={() => vote(p.id, VoteValue.No)}
                      >
                        <ImArrowDown />
                      </button>
                    </>
                  )}
                </span>,

                <div className="flex items-center">
                  <div className="">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      {p.id.toString()}
                    </div>
                  </div>
                </div>,
                <div>
                  {p.proposal.stage}{' '}
                  {p.proposal.stage !== 'Expiration' && (
                    <>
                      (<Countdown date={new Date(p.nextStageTime)} />)
                    </>
                  )}
                </div>,
                <span className={statusClassName}>
                  {status} ({p.percentage}%)
                </span>,
                <div>
                  <a
                    href={p.proposal.metadata?.descriptionURL}
                    target="_blank"
                    className="flex items-center  hover:text-gray-600 dark:text-gray-400 cursor-pointer space-x-2"
                  >
                    <span>Link</span>
                    <FiExternalLink />
                  </a>
                </div>,
              ];
            })}
          />
        </div>
      </Panel>
    </>
  );
}
