import { NetworkNames, useContractKit } from '@celo-tools/use-contractkit';
import {
  CopyText,
  Input,
  Panel,
  PanelWithButton,
  toast,
  Toggle,
  WithLayout,
} from '../components';
import { FiatCurrency, networks } from '../constants';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import { Base } from '../state';

export function Settings() {
  const { address, updateNetwork, network, performActions } = useContractKit();
  const {
    accountSummary,
    fetchAccountSummary,
    settings,
    toggleDarkMode,
    updateDefaultFiatCurrency,
  } = Base.useContainer();

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

    try {
      await performActions(async (k) => {
        const accounts = await k.contracts.getAccounts();
        if (!(await accounts.isAccount(address))) {
          await accounts
            .createAccount()
            .sendAndWaitForReceipt({ from: address });
        }

        try {
          if (accountSummary.name !== state.name) {
            await accounts
              .setName(state.name)
              .sendAndWaitForReceipt({ from: address });
          }
          if (accountSummary.metadataURL !== state.metadataURL) {
            await accounts
              .setMetadataURL(state.metadataURL)
              .sendAndWaitForReceipt({ from: address });
          }

          toast.success('Account data updated');
        } catch (e) {
          console.warn(e);
          toast.error('Unable to update data');
        }

        toast.success('Account updated');
        fetchAccountSummary();
      });
    } catch (e) {
      toast.error(e.message);
    }

    setSaving(false);
  }

  return (
    <>
      <PanelWithButton>
        <div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
                General
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Allow people to identify you on the Celo network.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium ">
                    Name
                  </label>
                  <div className="mt-1">
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={state.name}
                      onChange={(e) => changeProperty('name', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="metadataURL"
                    className="block text-sm font-medium "
                  >
                    Metadata URL
                  </label>
                  <div className="mt-1">
                    <Input
                      id="metadataURL"
                      name="metadataURL"
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
          className="ml-auto primary-button"
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
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
              Account data
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Addresses and signing keys associated with your account
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium ">
                  Address
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <Input id="name" name="name" readOnly value={address} />
                  <CopyText text={address} />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium ">
                  Wallet address
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <Input
                    id="name"
                    name="name"
                    placeholder="No wallet address set"
                    readOnly
                    value={accountSummary.wallet}
                  />
                  <CopyText text={accountSummary.wallet} />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium ">
                  Vote signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <Input
                    id="name"
                    name="name"
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
                <label htmlFor="name" className="block text-sm font-medium ">
                  Attestation signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <Input
                    id="name"
                    name="name"
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
                <label htmlFor="name" className="block text-sm font-medium ">
                  Validator signer
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <Input
                    id="name"
                    name="name"
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

      <Panel>
        <div>
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-gray-200">
                Plock
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Change behaviour of Plock to suit your usage better.
              </p>
            </div>
            <div className="mt-5 md:mt-0 md:col-span-2">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label htmlFor="name" className="block text-sm font-medium ">
                    Network
                  </label>

                  <select
                    name=""
                    id=""
                    className="p-2 dark:bg-gray-750 rounded-md border border-gray-300 dark:border-gray-500"
                    value={network.name}
                    onChange={(e) => {
                      const network = networks.find(
                        (n) => n.name === e.target.value
                      );
                      updateNetwork(network);
                    }}
                  >
                    {Object.values(NetworkNames).map((n) => (
                      <option value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="name" className="block text-sm font-medium ">
                    Default Currency
                  </label>

                  <select
                    name=""
                    id=""
                    className="p-2 dark:bg-gray-750 rounded-md border border-gray-300 dark:border-gray-500"
                    value={settings.currency}
                    onChange={(e) =>
                      updateDefaultFiatCurrency(e.target.value as FiatCurrency)
                    }
                  >
                    {Object.values(FiatCurrency).map((n) => (
                      <option value={n}>{n}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label
                    htmlFor="metadataURL"
                    className="block text-sm font-medium "
                  >
                    Dark Mode
                  </label>

                  <Toggle
                    active={settings.darkMode}
                    onChange={toggleDarkMode}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </>
  );
}
