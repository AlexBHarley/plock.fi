import { useContractKit } from '@celo-tools/use-contractkit';
import { CopyText, Panel, PanelWithButton, toast } from 'components';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Base } from 'state';

export default function General() {
  const { kit, address, send } = useContractKit();
  const { accountSummary, fetchAccountSummary } = Base.useContainer();

  const [state, setState] = useState({
    name: '',
    metadataURL: '',
  });
  const [saving, setSaving] = useState(false);

  function changeProperty(property: string, value: any) {
    return setState((s) => ({ ...s, [property]: value }));
  }

  useEffect(() => {
    changeProperty('name', accountSummary.name);
    changeProperty('metadataURL', accountSummary.metadataURL);
  }, [accountSummary]);

  async function save() {
    if (
      accountSummary.name === state.name &&
      accountSummary.metadataURL === state.metadataURL
    ) {
      return;
    }

    setSaving(true);

    const accounts = await kit.contracts.getAccounts();
    if (!(await accounts.isAccount(address))) {
      await send(accounts.createAccount());
    }

    try {
      if (accountSummary.name !== state.name) {
        await send(accounts.setName(state.name));
      }
      if (accountSummary.metadataURL !== state.metadataURL) {
        await send(accounts.setMetadataURL(state.metadataURL));
      }

      toast.success('Account data updated');
    } catch (e) {
      console.warn(e);
      toast.error('Unable to update data');
    }

    fetchAccountSummary();
    setSaving(false);
  }

  return (
    <>
      <PanelWithButton>
        <div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-200">
                General
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Allow people to identify you on the Celo network.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                      placeholder="John Doe"
                      value={state.name}
                      onChange={(e) => changeProperty('name', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="metadataURL"
                    className="block text-sm font-medium text-gray-300"
                  >
                    Metadata URL
                  </label>
                  <div className="mt-1">
                    <input
                      id="metadataURL"
                      name="metadataURL"
                      className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                      placeholder="https://example.com/metadata.json"
                      value={state.metadataURL}
                      onChange={(e) =>
                        changeProperty('metadataURL', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {saving ? (
            <Loader type="TailSpin" height={24} width={24} color="white" />
          ) : (
            'Submit'
          )}
        </button>
      </PanelWithButton>

      <Panel>
        <div className="md:grid md:grid-cols-3 md:gap-6 py-2">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-200">
              Account data
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Addresses and signing keys associated with your account
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Address
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="name"
                    name="name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                    readOnly
                    value={accountSummary?.address}
                  />
                  <CopyText text={accountSummary?.address} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Wallet address
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="name"
                    name="name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                    placeholder="No wallet address set"
                    readOnly
                    value={accountSummary.wallet}
                  />
                  <CopyText text={accountSummary.wallet} />
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Vote signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="name"
                    name="name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                    placeholder="No vote signing key set"
                    readOnly
                    value={accountSummary.authorizedSigners.attestation}
                  />
                  <CopyText
                    text={accountSummary.authorizedSigners.attestation}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Attestation signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="name"
                    name="name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                    placeholder="No attestation signing key set"
                    readOnly
                    value={accountSummary.authorizedSigners.attestation}
                  />
                  <CopyText
                    text={accountSummary.authorizedSigners.attestation}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300"
                >
                  Validator signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <input
                    id="name"
                    name="name"
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-600 text-gray-300 w-20"
                    placeholder="No validator signing key set"
                    readOnly
                    value={accountSummary.authorizedSigners.validator}
                  />
                  <CopyText text={accountSummary.authorizedSigners.validator} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
