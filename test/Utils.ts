import { BigNumberish } from "ethers";
import { ethers } from "hardhat";
import FiatTokenV2ABI from "./abi/FiatTokenV2ABI.json";
import { TOKENS } from "./Constants";

const { provider } = ethers;
const { parseUnits } = ethers.utils;

const sendETH = async (address, amount = 0.1) => {
  const signer = await provider.getSigner(0);
  await signer.sendTransaction({
    to: address,
    value: parseUnits(amount.toString(), 18),
  });
};

const unlockAccountAndGetSigner = async address => {
  await provider.send("hardhat_impersonateAccount", [address]);

  return provider.getSigner(address);
};

// eslint-disable-next-line
export const mintFiatTokenV2 = async ({ ownerAddress, tokenAddress, recipient, amount }) => {
  // Send owner some ETH
  await sendETH(ownerAddress);

  const minter = await provider.getSigner(8);
  const minterAddress = await minter.getAddress();

  const owner = await unlockAccountAndGetSigner(ownerAddress);
  const FiatTokenV2 = new ethers.Contract(tokenAddress, FiatTokenV2ABI, owner);

  await FiatTokenV2.updateMasterMinter(minterAddress);
  await FiatTokenV2.connect(minter).configureMinter(minterAddress, amount);
  await FiatTokenV2.connect(minter).mint(recipient, amount);
};

export const mintCADC = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  await mintFiatTokenV2({
    ownerAddress: TOKENS.CADC.owner,
    tokenAddress: TOKENS.CADC.address,
    recipient,
    amount,
  });
};

export const mintUSDC = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  await mintFiatTokenV2({
    ownerAddress: TOKENS.USDC.owner,
    tokenAddress: TOKENS.USDC.address,
    recipient,
    amount,
  });
};

export const getLatestBlockTime = async (): Promise<number> => {
  const blockNumber = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNumber);

  return block.timestamp;
};

export const getFutureTime = async (): Promise<number> => {
  const t = await getLatestBlockTime();
  return t + 60;
};
