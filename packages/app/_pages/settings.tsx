import { NetworkNames, useContractKit } from '@celo-tools/use-contractkit';
import { useEffect, useState } from 'react';
import Loader from 'react-loader-spinner';
import {
  AddressInput,
  Input,
  Panel,
  PanelDescription,
  PanelGrid,
  PanelHeader,
  PanelWithButton,
  toast,
  Toggle,
} from '../components';
import { FiatCurrency, networks } from '../constants';
import { Base } from '../state';

export function Settings() {
  const { address, updateNetwork, network, performActions } = useContractKit();
  const {
    accountSummary,
    fetchAccountSummary,
    settings,
    toggleDarkMode,
    updateDefaultFiatCurrency,
    track,
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
    track('account/update');

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
        <PanelGrid>
          <div>
            <PanelHeader>General</PanelHeader>
            <PanelDescription>
              Allow people to identify you on the Celo network
            </PanelDescription>
          </div>
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
        </PanelGrid>

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
        <PanelGrid>
          <div>
            <PanelHeader>Account data</PanelHeader>
            <PanelDescription>
              Addresses and signing keys associated with your account
            </PanelDescription>
          </div>
          <div className="space-y-6">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium ">
                Address
              </label>

              <AddressInput
                value={address}
                copyable
                scanToCopy
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium ">
                Wallet address
              </label>
              <AddressInput
                placeholder="No wallet address set"
                value={accountSummary.wallet}
                copyable
                scanToCopy
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium ">
                Vote signer
              </label>
              <AddressInput
                placeholder="No vote signing set"
                value={accountSummary.authorizedSigners.vote}
                copyable
                scanToCopy
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium ">
                Attestation signer
              </label>
              <AddressInput
                placeholder="No attestation signing set"
                value={accountSummary.authorizedSigners.attestation}
                copyable
                scanToCopy
                disabled
                readOnly
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium ">
                Validator signer
              </label>
              <AddressInput
                placeholder="No attestation signing set"
                value={accountSummary.authorizedSigners.validator}
                copyable
                scanToCopy
                disabled
                readOnly
              />
            </div>
          </div>
        </PanelGrid>
      </Panel>

      <Panel>
        <PanelGrid>
          <div>
            <PanelHeader>Plock</PanelHeader>
            <PanelDescription>
              Change behaviour of Plock to suit your usage better.
            </PanelDescription>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label htmlFor="name" className="block text-sm font-medium ">
                Network
              </label>

              <select
                name=""
                id=""
                className="py-2 dark:bg-gray-750 rounded-md border border-gray-300 dark:border-gray-500"
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
                className="py-2 dark:bg-gray-750 rounded-md border border-gray-300 dark:border-gray-500"
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

              <Toggle active={settings.darkMode} onChange={toggleDarkMode} />
            </div>
          </div>
        </PanelGrid>
      </Panel>
    </>
  );
}
