import '@celo-tools/use-contractkit/lib/styles.css';
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
            data-domain="celotools.com"
            src="https://stats.celotools.com/js/index.js"
          />
        )}
      </Head>

      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
