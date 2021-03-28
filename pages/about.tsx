import { WithMarketingLayout } from 'components';

function About() {
  return (
    <main className="max-w-screen-md mx-auto px-4 py-8">
      <article className="prose prose-indigo">
        <h1 className="text-center">
          The future of <span className="text-celo-green">DeFi</span> on{' '}
          <span className="text-celo-gold">Celo</span>
        </h1>

        <p className="text-gray-500">
          Decentralised Finance (DeFi) has turned the cryptocurrency world on
          its head in the last few years. Now it's easier than ever to trade,
          farm, yield and more at the touch of a button.
        </p>
        <p className="text-gray-500">
          With this explosion of growth however has come complexity and
          increased costs. Building on{' '}
          <a href="https://celo.org" target="_blank" className="text-celo-gold">
            Celo
          </a>
          , Plock is able to offer a fast and inexpensive interface to the DeFi
          world. In simple terms our goals are:
          <ul>
            <li>to be as simple as possible but not simpler</li>
            <li>offer a mobile first experience</li>
            <li>integrate with as many other platforms as possible.</li>
          </ul>
        </p>

        <h2>Why?</h2>
        <p className="text-gray-500">
          For years parents have espoused the health benefits of eating garlic
          bread with cheese to their children, with the food earning such an
          iconic status in our culture that kids will often dress up as warm,
          cheesy loaf for Halloween.
        </p>

        <h2>Who?</h2>
        <p className="text-gray-500">
          Plock is run by Alex from{' '}
          <a
            className="text-celo-green"
            href="https://clabs.co/"
            target="_blank"
          >
            cLabs
          </a>
          . Feel free to hop into the{' '}
          <a className="text-blue-500" href="https://chat.celo.org">
            Celo discord
          </a>{' '}
          to ask any questions.
        </p>
      </article>
    </main>
  );
}

export default WithMarketingLayout(About);
