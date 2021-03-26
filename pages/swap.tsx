import { Balances, Panel, WithLayout } from 'components';

function Swap() {
  return (
    <>
      <Panel>
        <div className="flex justify-center text-gray-300">Coming soon</div>
      </Panel>

      <Panel>
        <Balances />
      </Panel>
    </>
  );
}

export default WithLayout(Swap);
