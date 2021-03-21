import { ApolloProvider } from '@apollo/client';
import { WithAppLayout, WithSidebar } from 'components';
import Head from 'next/head';
import { Base } from 'state';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import '@celo-tools/use-contractkit/lib/styles.css';
import '../styles/globals.css';

function BaseComponent({ children }: any) {
  const { graphql } = Base.useContainer();

  return (
    <ApolloProvider client={graphql}>
      <WithAppLayout>{children}</WithAppLayout>
    </ApolloProvider>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CeloTools</title>
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

      <ContractKitProvider dappName="CeloTools">
        <Base.Provider>
          <BaseComponent>
            <WithSidebar>
              <Component {...pageProps} />
            </WithSidebar>
          </BaseComponent>
        </Base.Provider>
      </ContractKitProvider>
    </>
  );
}

export default MyApp;
