/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import FiatTokenV2ABI from "./abis/FiatTokenV2ABI.json";
import FiatTokenV1ABI from "./abis/FiatTokenV1ABI.json";
import DfxAbi from "./abis/Dfx.json";
import { Chains } from "./constants";
import { ValidChainId } from "./chainId";
import { sendEth, unlockAccountAndGetSigner } from "./utils";

const { provider } = ethers;
const { parseUnits, formatUnits } = ethers.utils;

const isEth = (chainId: ValidChainId) => chainId === 1 || chainId === 1337;
const isPolygon = (chainId: ValidChainId) => chainId === 137 || chainId === 1338;

interface MintFiatTokenV2 {
  ownerAddress: string;
  tokenAddress: string;
  recipient: string;
  amount: BigNumberish;
}
export const mintFiatTokenV2 = async ({
  ownerAddress,
  tokenAddress,
  recipient,
  amount,
}: MintFiatTokenV2): Promise<void> => {
  // Send owner some ETH
  await sendEth(ownerAddress);

  const minter = await provider.getSigner(8);
  const minterAddress = await minter.getAddress();

  const owner = await unlockAccountAndGetSigner(ownerAddress);
  const FiatTokenV2 = new ethers.Contract(tokenAddress, FiatTokenV2ABI, owner);

  await FiatTokenV2.updateMasterMinter(minterAddress);
  await FiatTokenV2.connect(minter).configureMinter(minterAddress, amount);
  await FiatTokenV2.connect(minter).mint(recipient, amount);
};

export const setStorageAt = async (address: string, index: string, value: string): Promise<void> => {
  await ethers.provider.send("hardhat_setStorageAt", [address, index, value]);
};
interface MintMaticBridgedToken {
  tokenAddress: string;
  recipient: string;
  amount: BigNumber;
}
export const mintMaticBridgedToken = async ({
  tokenAddress,
  recipient,
  amount,
}: MintMaticBridgedToken): Promise<void> => {
  const index = ethers.utils
    .solidityKeccak256(
      ["uint256", "uint256"],
      [recipient, 0], // key, slot
    )
    .toString();
  const val = ethers.utils.hexlify(ethers.utils.zeroPad(amount.toHexString(), 32));

  await setStorageAt(tokenAddress, index, val);
};

export const mintUsdc = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    await mintFiatTokenV2({
      ownerAddress: Chains[chainId].Tokens.usdc.owner,
      tokenAddress: Chains[chainId].Tokens.usdc.address,
      recipient,
      amount,
    });
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.usdc.address,
      recipient,
      amount: BigNumber.from(amount),
    });
  }
  console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.usdc.decimals)} USDC`);
};

export const mintCadc = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    await mintFiatTokenV2({
      ownerAddress: Chains[chainId].Tokens.cadc.owner,
      tokenAddress: Chains[chainId].Tokens.cadc.address,
      recipient,
      amount,
    });
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.cadc.address,
      recipient,
      amount: BigNumber.from(amount),
    });
  }
  console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.cadc.decimals)} CADC`);
};

export const mintXsgd = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    // Send minter some ETH
    await sendEth(Chains[chainId].Tokens.xsgd.masterMinter);
    const owner = await unlockAccountAndGetSigner(Chains[chainId].Tokens.xsgd.masterMinter);
    const xsgd = new ethers.Contract(Chains[chainId].Tokens.xsgd.address, FiatTokenV1ABI, owner);
    await xsgd.increaseMinterAllowance(Chains[chainId].Tokens.xsgd.masterMinter, amount);
    await xsgd.mint(recipient, amount);

    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.xsgd.decimals)} XSGD`);
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.xsgd.address,
      recipient,
      amount: BigNumber.from(amount),
    });
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.xsgd.decimals)} XSGD`);
  }
};

export const mintXidr = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    // Send minter some ETH
    await sendEth(Chains[1].Tokens.xidr.masterMinter);
    const owner = await unlockAccountAndGetSigner(Chains[1].Tokens.xidr.masterMinter);
    const xidr = new ethers.Contract(Chains[1].Tokens.xidr.address, FiatTokenV1ABI, owner);
    await xidr.increaseMinterAllowance(Chains[1].Tokens.xidr.masterMinter, amount);
    await xidr.mint(recipient, amount);

    console.log(`Minted ${formatUnits(amount, Chains[1].Tokens.xidr.decimals)} XIDR`);
  } else if (isPolygon(chainId)) {
    console.log("Cannot mint XIDR on Polygon yet.");
  }
};

export const mintDfx = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    const ownerAddress = Chains[chainId].Tokens.dfx.owner;
    const tokenAddress = Chains[chainId].Tokens.dfx.address;

    // Send owner some ETH
    await sendEth(ownerAddress);

    const owner = await unlockAccountAndGetSigner(ownerAddress);
    const dfx = new ethers.Contract(tokenAddress, DfxAbi, owner);

    await dfx.connect(owner).mint(recipient, amount);
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.dfx.decimals)} DFX`);
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.dfx.address,
      recipient,
      amount: BigNumber.from(amount),
    });

    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.dfx.decimals)} DFX`);
  }
};

export const mintTel = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (isEth(chainId)) {
    console.log("Cannot mint TEL on Ethereum yet");
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.tel.address,
      recipient,
      amount: BigNumber.from(amount),
    });

    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.tel.decimals)} TEL`);
  }
};

export const mintNzds = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (chainId === 1 || chainId === 1337) {
    await mintFiatTokenV2({
      ownerAddress: Chains[chainId].Tokens.nzds.owner,
      tokenAddress: Chains[chainId].Tokens.nzds.address,
      recipient,
      amount,
    });
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.nzds.decimals)} NZDS`);
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.nzds.address,
      recipient,
      amount: BigNumber.from(amount),
    });
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.nzds.decimals)} NZDS`);
  }
};

export const mintTryb = async (recipient: string, amount: BigNumberish, chainId: ValidChainId): Promise<void> => {
  if (chainId === 1 || chainId === 1337) {
    await mintFiatTokenV2({
      ownerAddress: Chains[chainId].Tokens.tryb.owner,
      tokenAddress: Chains[chainId].Tokens.tryb.address,
      recipient,
      amount,
    });
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.nzds.decimals)} TRYB`);
  } else if (isPolygon(chainId)) {
    await mintMaticBridgedToken({
      tokenAddress: Chains[chainId].Tokens.tryb.address,
      recipient,
      amount: BigNumber.from(amount),
    });
    console.log(`Minted ${formatUnits(amount, Chains[chainId].Tokens.nzds.decimals)} TRYB`);
  }
};

export const mint = async (chainId: ValidChainId): Promise<void> => {
  console.log(`Minting tokens using chainId ${chainId} addresses...`);

  const [user0] = await ethers.getSigners();
  const address = await user0.getAddress();

  await mintDfx(address, parseUnits("2000000", Chains[chainId].Tokens.dfx.decimals), chainId);

  await mintUsdc(address, parseUnits("2000000", Chains[chainId].Tokens.usdc.decimals), chainId);

  await mintCadc(address, parseUnits("2000000", Chains[chainId].Tokens.cadc.decimals), chainId);

  await mintXsgd(address, parseUnits("2000000", Chains[chainId].Tokens.xsgd.decimals), chainId);

  await mintNzds(address, parseUnits("2000000", Chains[chainId].Tokens.nzds.decimals), chainId);
  await mintTryb(address, parseUnits("2000000", Chains[chainId].Tokens.tryb.decimals), chainId);
  await mintXidr(address, parseUnits("2000000", Chains[1].Tokens.xidr.decimals), chainId);

  console.log("Minting complete!");
};

export const Mint = {
  cadc: mintCadc,
  dfx: mintDfx,
  usdc: mintUsdc,
  xsgd: mintXsgd,
  nzds: mintNzds,
  tryb: mintTryb,
  xidr: mintXidr,
};
