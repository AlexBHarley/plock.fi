import { useContractKit } from 'use-contractkit';
import { Panel, Table } from 'components';
import { useCallback, useEffect, useState } from 'react';
import { ImArrowDown, ImArrowUp } from 'react-icons/im';
import { FiExternalLink } from 'react-icons/fi';
import { VoteValue } from '@celo/contractkit/lib/wrappers/Governance';

export default function Vote() {
  const { kit } = useContractKit();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    const governance = await kit.contracts.getGovernance();
    const dequeue = await governance.getDequeue();

    setProposals(
      await Promise.all(
        dequeue.map(async (p) => {
          const isExpired = await governance.isDequeuedProposalExpired(p);
          // const stage = await governance.getProposalStage(p);
          // const proposal = await governance.getProposal(p);
          const record = await governance.getProposalRecord(p);
          // const constitution = await governance.getConstitution(proposal);

          const voteRecord = await governance.getVoteRecord(
            kit.defaultAccount,
            p
          );
          //
          // console.log(await proposalToJSON(kit, proposal));
          const isPassing = await governance.isProposalPassing(p);
          const isApproved = await governance.isApproved(p);
          const timeUntilStages = await governance.humanReadableTimeUntilStages(
            p
          );

          return {
            id: p,
            isExpired,
            isPassing,
            isApproved,
            timeUntilStages,
            vote: voteRecord ? voteRecord.value : 'None',
          };
        })
      )
    );
    setLoading(false);
  }, [kit]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const upvote = async (id: string) => {
    // requireInitialised
    const governance = await kit.contracts.getGovernance();
    await (
      await governance.upvote(id, kit.defaultAccount)
    ).sendAndWaitForReceipt();
    fetchProposals();
  };

  const downvote = async (id: string) => {
    // requireInitialised
    const governance = await kit.contracts.getGovernance();
    await (await governance.vote(id, VoteValue.No)).sendAndWaitForReceipt();
    fetchProposals();
  };

  return (
    <>
      <Panel>
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-200">
            Proposals
          </h3>
          <p className="text-gray-400 mt-2 text-sm">
            Celo uses a formal on-chain governance mechanism to manage and
            upgrade the protocol. You can have your say in this by voting on
            proposals and being active in the community. More information around
            this can be found in the{' '}
            <a
              className="text-blue-500"
              target="_blank"
              href="https://docs.celo.org/celo-codebase/protocol/governance"
            >
              Governance documentation
            </a>
            .
          </p>
        </div>
        <Table
          headers={['', 'ID', 'Status', 'Description']}
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
            return [
              // {/* upvoted / downvoted */}
              <span
                className="inline-flex text-gray-500 space-x-3"
                style={{ width: 'fit-content' }}
              >
                <button className={upvoteClass} onClick={() => upvote(p.id)}>
                  <ImArrowUp />
                </button>
                <button
                  className={downVoteClass}
                  onClick={() => downvote(p.id)}
                >
                  <ImArrowDown />
                </button>
              </span>,

              <div className="flex items-center">
                <div className="">
                  <div className="text-sm font-medium text-gray-200">
                    {p.id.toString()}
                  </div>
                </div>
              </div>,
              p.isApproved ? (
                <span className="border rounded border-green-500 text-green-500 px-2 py-1">
                  Approved
                </span>
              ) : p.isExpired ? (
                <span className="border rounded border-gray-500 text-gray-500 px-2 py-1">
                  Expired
                </span>
              ) : p.isPassing ? (
                'Passing'
              ) : (
                'Not passing'
              ),
              <div>
                <a
                  href={p.metadata?.descriptionURL}
                  className="flex items-center text-gray-300 hover:text-gray-400 cursor-pointer space-x-2"
                >
                  <span>Link</span>
                  <FiExternalLink />
                </a>
              </div>,
            ];
          })}
        />
      </Panel>
    </>
  );
}
