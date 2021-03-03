import { ethers } from "hardhat";
import { TOKENS } from "./Constants";
import { BigNumberish, ContractReceipt, Signer } from "ethers";

import EACAggregatorProxyABI from "./abi/EACAggregatorProxy.json";
import EURSABI from "./abi/EURSABI.json";
import FiatTokenV1ABI from "./abi/FiatTokenV1ABI.json";
import FiatTokenV2ABI from "./abi/FiatTokenV2ABI.json";

const { provider } = ethers;
const { parseUnits } = ethers.utils;

const sendETH = async (address, amount = 0.1) => {
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

export const mintXSGD = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  // Send minter some ETH
  await sendETH(TOKENS.XSGD.masterMinter);

  const owner = await unlockAccountAndGetSigner(TOKENS.XSGD.masterMinter);
  const XSGD = new ethers.Contract(TOKENS.XSGD.address, FiatTokenV1ABI, owner);

  await XSGD.increaseMinterAllowance(TOKENS.XSGD.masterMinter, amount);
  await XSGD.mint(recipient, amount);
};

export const mintEURS = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  // Send minter some ETH
  await sendETH(TOKENS.EURS.owner);

  const owner = await unlockAccountAndGetSigner(TOKENS.EURS.owner);
  const EURS = new ethers.Contract(TOKENS.EURS.address, EURSABI, owner);

  // Function is payable so need value: 0
  await EURS.createTokens(amount, { value: 0 });
  await EURS.transfer(recipient, amount);
};

export const updateOracleAnswer = async (oracleAddress: string, amount: BigNumberish | number): Promise<void> => {
  let oracle = await ethers.getContractAt(EACAggregatorProxyABI, oracleAddress);
  const owner = await unlockAccountAndGetSigner(await oracle.owner());
  oracle = oracle.connect(owner);
  await sendETH(await owner.getAddress(), 0.1);

  const NewAggregator = await ethers.getContractFactory("MockAggregator", owner);
  const aggregator = await NewAggregator.deploy();
  await aggregator.deployed();

  aggregator.setAnswer(amount);
  await oracle.proposeAggregator(aggregator.address);
  await oracle.confirmAggregator(aggregator.address);
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

export const getCurveAddressFromTxRecp = (txRecp: ContractReceipt): string => {
  const abi = ["event NewCurve(address indexed caller, address indexed curve)"];
  const iface = new ethers.utils.Interface(abi);

  const events = txRecp.logs
    .map(x => {
      try {
        return iface.parseLog(x);
      } catch (e) {
        return null;
      }
    })
    .filter(x => x !== null);

  if (!events[0]?.args[1]) {
    throw new Error("Unable to find curve address from tx recp");
  }

  return events[0]?.args[1];
};
