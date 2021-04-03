import { Balances, Panel, WithLayout } from 'components';

function Dashboard() {
  return (
    <>
      <Panel></Panel>

      <Balances />
    </>
  );
}

export default WithLayout(Dashboard);
