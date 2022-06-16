/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { Curve__factory } from "../../typechain";

const { provider } = ethers;
const { parseUnits, formatUnits } = ethers.utils;

export const sendEth = async (address: string, amount = 0.1): Promise<void> => {
  const signer = await provider.getSigner(0);
  await signer.sendTransaction({
    to: address,
    value: parseUnits(amount.toString(), 18),
  });
};

export const unlockAccountAndGetSigner = async (address: string): Promise<Signer> => {
  await provider.send("hardhat_impersonateAccount", [address]);
  return provider.getSigner(address);
};

export const turnOffWhitelisting = async (curveAddress: string, ownerAddress: string): Promise<void> => {
  await sendEth(ownerAddress, 1);
  const signer = await unlockAccountAndGetSigner(ownerAddress);
  const curve = Curve__factory.connect(curveAddress, signer);
  await curve.turnOffWhitelisting();
  console.log(`Whitelisting for ${curveAddress} turned off`);
};
export const getDeadlineEpochTime = (minutesToDeadline: string): number =>
  Date.now() + parseInt(minutesToDeadline) * 60 * 1000;
