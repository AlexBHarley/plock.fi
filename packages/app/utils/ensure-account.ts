export const ensureAccount = async (kit: any, address: string) => {
  const accounts = await kit.contracts.getAccounts();
  if (!accounts.isAccount(address)) {
    await accounts.createAccount().sendAndWaitForReceipt({ from: address });
  }
};
