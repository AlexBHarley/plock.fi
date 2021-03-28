import { formatAmount, toWei, truncateAddress } from 'utils';
import { Panel } from './panel';
import { useContractKit } from '@celo-tools/use-contractkit';
import { Base } from 'state';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'components';
import Loader from 'react-loader-spinner';
import { Table } from './table';
import { TokenIcons } from './icon';

enum States {
  None,
  Activating,
  Revoking,
  Locking,
  Unlocking,
}

const names = {
  CELO: 'CELO',
  cUSD: 'Celo Dollar',
  cEUR: 'Celo Euro',
};

export function Balances() {
  const { address, kit, send } = useContractKit();
  const { accountSummary, lockedSummary, balances } = Base.useContainer();
  const [lockAmount, setLockAmount] = useState('');
  const [state, setState] = useState(States.None);

  const balanceList = Object.keys(balances).map((symbol) => ({
    symbol,
    balance: balances[symbol],
  }));

  return (
    <Panel>
      <h3 className="text-xl font-medium leading-6 text-gray-900 dark:text-gray-200">
        Balances
      </h3>

      <div className="-mx-5">
        <Table
          headers={['Token', 'Balance', 'Value']}
          loading={false}
          noDataMessage={''}
          rows={balanceList.map(({ symbol, balance }) => {
            const Icon = TokenIcons[symbol];
            return [
              <div className="flex items-center space-x-2">
                {Icon ? <Icon height="25px" width="25px" /> : <></>}
                <div className="spacey-y-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                    {symbol}
                  </div>
                  <div className="text-xs ">{names[symbol]}</div>
                </div>
              </div>,
              <span className={''}>{formatAmount(balance)}</span>,
              <span className={''}>Coming soon...</span>,
            ];
          })}
        />
      </div>
    </Panel>
  );
}
