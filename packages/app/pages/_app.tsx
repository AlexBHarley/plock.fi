import '@celo-tools/use-contractkit/lib/styles.css';
import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
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
            data-domain="app.plock.fi"
            src="https://stats.app.plock.fi/js/index.js"
          />
        )}
      </Head>

      <div suppressHydrationWarning>
        {typeof window === 'undefined' ? null : <Component {...pageProps} />}
      </div>
    </>
  );
}

export default MyApp;
