import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Plock - DeFi Dashboard</title>
        <link rel="icon" href="/logo.png" />
        <meta name="keywords" content="celo, cryptocurrency, defi" />
        <meta name="description" content="The Defi dashboard for Celo" />

        <script async src="/dark-mode.js" />

        {process.browser && (
          <script
            async
            defer
            data-domain="plock.fi"
            src="https://stats.plock.fi/js/plausible.js"
          />
        )}
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
