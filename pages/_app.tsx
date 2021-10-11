import '@celo-tools/use-contractkit/lib/styles.css';
import { AppProps } from 'next/app';
import Head from 'next/head';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Plock</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="keywords" content="celo, cryptocurrency, defi" />
        <meta
          name="description"
          content="Access to the decentralised world of Celo"
        />

          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="manifest" href="/manifest.json" />
          <link href="/favicon-16x16.png" rel="icon" type="image/png" sizes="16x16" />
          <link href="/favicon-32x32.png" rel="icon" type="image/png" sizes="32x32" />
          <link rel="apple-touch-icon" href="/apple-icon.png"></link>
          <meta name="theme-color" content="#317EFB" />

        <script async src="/dark-mode.js" />

        {process.browser && (
          <>
            <script
              async
              defer
              data-domain="app.plock.fi"
              src="https://stats.app.plock.fi/js/index.js"
            />
            <script
              dangerouslySetInnerHTML={{
                __html:
                  'window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }',
              }}
            ></script>
          </>
        )}
      </Head>

      <div suppressHydrationWarning>
        {typeof window === 'undefined' ? null : <Component {...pageProps} />}
      </div>
    </>
  );
}

export default MyApp;
