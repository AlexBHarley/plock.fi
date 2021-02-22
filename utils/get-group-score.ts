import { ContractKit } from '@celo/contractkit';
import BigNumber from 'bignumber.js';

export async function getValidatorGroupScore(
  kit: ContractKit,
  groupAddress: string
) {
  const election = await kit.contracts.getElection();
  const validators = await kit.contracts.getValidators();

  const group = await validators.getValidatorGroup(groupAddress);
  const electedValidatorSigners = await election.getCurrentValidatorSigners();
  const electedValidators = await Promise.all(
    electedValidatorSigners.map(async (signer) => {
      const account = await validators.signerToAccount(signer);
      return validators.getValidator(account);
    })
  );

  const total = group.members.reduce((accum, address) => {
    const v = electedValidators.find((ev) => ev.address === address);
    if (!v) {
      return accum.plus(0);
    }
    return accum.plus(v.score);
  }, new BigNumber(0));

  return total.dividedBy(group.members.length);
}
