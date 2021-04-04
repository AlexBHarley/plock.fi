import { Link as InternalLink } from 'react-router-dom';
import { Balances, Panel, PanelDescription, PanelHeader } from '../components';

function Link({ url, children }: { url: string; children: any }) {
  const className = 'text-blue-500 underline';
  if (url.startsWith('https://')) {
    return (
      <a href={url} target="_blank" className={className}>
        {children}
      </a>
    );
  }

  return (
    <InternalLink to={url}>
      <a className={className}>{children}</a>
    </InternalLink>
  );
}

export function Dashboard() {
  return (
    <>
      <Panel>
        <div className="relative">
          <PanelHeader>Welcome to Plock.fi</PanelHeader>
          <PanelDescription>
            Plock.fi is your home for everything DeFi on Celo.
          </PanelDescription>

          <div className="absolute right-2 top-0">
            <div className="text-lg text-gray-500 font-light">Net Worth</div>
            <div className="text-3xl">$0.00</div>
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-400 text-sm leading-7">
          <p className="mb-1">Get started right now by:</p>

          <ul className="list-inside list-disc ">
            <li>
              Swapping tokens with <Link url="/swap">Ubeswap</Link>
            </li>
            <li>
              Providing liquidity on <Link url="/lend">Moola Market</Link>
            </li>
            <li>
              <Link url="/earn">Staking</Link> your CELO for passive rewards
            </li>
            <li>
              <Link url="/vote">Voting</Link> on Celo governance proposals
            </li>
            <li>
              <Link url="/stream">Streaming</Link> money in realtime
            </li>
          </ul>
        </div>
      </Panel>

      <Balances />
    </>
  );
}
