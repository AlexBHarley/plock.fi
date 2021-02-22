import '../styles/globals.css';
import { Base } from 'state';
import { ApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client';
import { WithAppLayout, WithSidebar } from 'components';
import Head from 'next/head';

import { ContractKitProvider } from 'use-contractkit';
import { useState } from 'react';
import Loader from 'react-loader-spinner';

function BaseComponent({ children }: any) {
  const { graphql } = Base.useContainer();

  return (
    <ApolloProvider client={graphql}>
      <WithAppLayout>{children}</WithAppLayout>
    </ApolloProvider>
  );
}

export function Ledger({ onSubmit }: { onSubmit: () => Promise<void> }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800" style={{ width: '450px' }}>
      <div className="px-8 py-6">
        <div className="flex space-x-8">
          <img src={'/ledger.png'} style={{ height: '36px', width: '36px' }} />

          <div className="flex flex-col">
            <div className="text-gray-200 text-xl font-medium mb-2">
              Ledger Connect
            </div>
            <p className="text-gray-400 leading-tight text-sm">
              Securely connect Celo Manager to your ledger device. Before
              proceeding, please ensure you have:
              <ul className="list-disc list-inside">
                <li className="mt-2">Connected your Ledger (via USB)</li>
                <li className="mt-2">Unlocked your Ledger</li>
                <li className="mt-2">
                  Opened the{' '}
                  <a
                    className="text-gray-200"
                    href="https://docs.celo.org/celo-owner-guide/ledger"
                    target="_blank"
                  >
                    Celo application
                  </a>{' '}
                </li>
              </ul>
            </p>
            {error && <p className="text-red-500 text-xs pb-1 pt-3">{error}</p>}
            <button className="primary-button mt-4" onClick={submit}>
              {submitting ? (
                <div className="flex items-center justify-center">
                  <Loader
                    type="TailSpin"
                    color="white"
                    height={18}
                    width={18}
                  />
                </div>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivateKey({
  onSubmit,
}: {
  onSubmit: (privateKey: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <div className="bg-gray-800" style={{ width: '400px' }}>
      <div className="px-4 py-6 space-y-3 flex flex-col">
        <h3 className="text-gray-300">Enter your private key</h3>
        <p className="text-gray-400 text-sm">
          This will be saved locally in plaintext, be sure to logout before
          leaving this computer unattended
        </p>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300"
        />
        <button
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          onClick={() => onSubmit(value)}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Celo Home</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <ContractKitProvider
        dappName="Celo Home"
        reactModalProps={{
          style: {
            overlay: {
              background: 'rgb(55,65,81, 0.75)',
              zIndex: 1000,
            },
          },
        }}
        renderProvider={(p) => (
          <div>
            <button
              className="flex border border-transparent hover:border-purple-300 transition px-4 py-2 rounded w-full space-x-4"
              onClick={p.onClick}
            >
              <div className="mt-1">
                {typeof p.image === 'string' ? (
                  <img src={p.image} height={20} width={20} />
                ) : (
                  <span className="text-gray-300">{p.image}</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="font-medium text-left text-gray-300 text-sm">
                  {p.name}
                </div>
                <div className="text-left text-gray-400 text-sm">
                  {p.description}
                </div>
              </div>
            </button>
          </div>
        )}
      >
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
