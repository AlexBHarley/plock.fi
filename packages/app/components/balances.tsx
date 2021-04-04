import { useContractKit } from '@celo-tools/use-contractkit';
import { tokens } from '../constants';
import { useState } from 'react';
import { Base } from '../state';
import { formatAmount } from '../utils';
import { TokenIcons } from './icon';
import { Panel } from './panel';
import { Table } from './table';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
}

export function Balances() {
  const { balances, fetchingBalances } = Base.useContainer();

  return (
    <Panel>
      <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-gray-200">
        Balances
      </h3>

      <div className="-mx-5">
        <Table
          headers={['Token', 'Balance', 'Value']}
          loading={fetchingBalances}
          noDataMessage={'No tokens deployed'}
          rows={Object.keys(balances).map((ticker) => {
            const Icon = TokenIcons[ticker];
            const token = tokens.find((t) => t.ticker === ticker);
            return [
              <div className="flex items-center space-x-2">
                {Icon ? <Icon height="25px" width="25px" /> : <></>}
                <div className="spacey-y-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    {ticker}
                  </div>
                  <div className="text-xs ">{token.name}</div>
                </div>
              </div>,
              <span className={''}>{formatAmount(balances[ticker])}</span>,
              <span className={''}>Coming soon...</span>,
            ];
          })}
        />
      </div>
    </Panel>
  );
}
