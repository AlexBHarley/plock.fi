import { CURRENCY_ENUM } from '@celo/utils';
import { Balances, Input, Panel, WithLayout } from 'components';
import { tokens, TokenTicker } from '../constants';
import { useState } from 'react';
import { useContractKit } from '@celo-tools/use-contractkit';

function Swap() {
  const { network } = useContractKit();
  const [from, setFrom] = useState(
    tokens.find((t) => t.name === TokenTicker.CELO)
  );
  const [fromAmount, setFromAmount] = useState('');
  const [to, setTo] = useState(tokens.find((t) => t.name === TokenTicker.cUSD));
  const [toAmount, setToAmount] = useState('');

  return (
    <>
      <Panel>
        <h3 className="text-lg font-medium leading-6 text-gray-200">Swap</h3>
        <p className="text-gray-400 mt-2 text-sm">
          Celo uses a formal on-chain governance mechanism to manage and upgrade
          the protocol. You can have your say in this by{' '}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://docs.celo.org/celo-owner-guide/voting-governance"
          ></a>
          voting on proposals and being active in the community. More
          information around this can be found in the{' '}
          <a
            className="text-blue-500"
            target="_blank"
            href="https://docs.celo.org/celo-codebase/protocol/governance"
          >
            Governance documentation
          </a>
          .
        </p>
      </Panel>
      <Panel>
        <div className="flex flex-column md:flex-row">
          <Input
            value={fromAmount}
            onChange={(e) => setFromAmount(e.target.value)}
          />
          <Input
            value={toAmount}
            onChange={(e) => setToAmount(e.target.value)}
          />
        </div>
      </Panel>

      <Balances />
    </>
  );
}

export default WithLayout(Swap);
