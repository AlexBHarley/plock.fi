import '@celo-tools/use-contractkit/lib/styles.css';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Plock.fi</title>
        <link rel="icon" href="/favicon.ico" />

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
