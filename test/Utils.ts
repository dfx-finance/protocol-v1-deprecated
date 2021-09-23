import { ethers } from "hardhat";
import { TOKENS } from "./Constants";
import { BigNumber, BigNumberish, ContractReceipt, Signer } from "ethers";
import { expect } from "chai";

import EACAggregatorProxyABI from "./abi/EACAggregatorProxy.json";
import EURSABI from "./abi/EURSABI.json";
import FiatTokenV1ABI from "./abi/FiatTokenV1ABI.json";
import FiatTokenV2ABI from "./abi/FiatTokenV2ABI.json";
import { Result } from "ethers/lib/utils";

const { provider } = ethers;
const { parseUnits } = ethers.utils;

const sendETH = async (address, amount = 0.1) => {
  const signer = await provider.getSigner(0);
  await signer.sendTransaction({
    to: address,
    value: parseUnits(amount.toString(), 18),
  });
};

export function snapshotAndRevert() {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await ethers.provider.send("evm_snapshot", []);
  });

  afterEach(async () => {
    await ethers.provider.send("evm_revert", [snapshotId]);
  });
}

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

export const mintNZDS = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  await mintFiatTokenV2({
    ownerAddress: TOKENS.NZDS.owner,
    tokenAddress: TOKENS.NZDS.address,
    recipient,
    amount,
  });
};

export const mintTRYB = async (recipient: string, amount: BigNumberish | number): Promise<void> => {
  await mintFiatTokenV2({
    ownerAddress: TOKENS.TRYB.owner,
    tokenAddress: TOKENS.TRYB.address,
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

export const getOracleAnswer = async (oracleAddress: string): Promise<BigNumber> => {
  if (oracleAddress === TOKENS.USDC.address) {
    return parseUnits("1", 8);
  }

  const oracle = await ethers.getContractAt(EACAggregatorProxyABI, oracleAddress);
  const roundData = await oracle.latestRoundData();
  return roundData.answer;
};

export const updateOracleAnswer = async (oracleAddress: string, amount: BigNumberish | number): Promise<void> => {
  let oracle = await ethers.getContractAt(EACAggregatorProxyABI, oracleAddress);
  const owner = await unlockAccountAndGetSigner(await oracle.owner());

  const [u] = await ethers.getSigners();
  await u.sendTransaction({
    to: await owner.getAddress(),
    value: parseUnits("10"),
  });

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

  if (block) {
    return block.timestamp;
  }

  return new Date().getTime();
};

export const getFutureTime = async (): Promise<number> => {
  const t = await getLatestBlockTime();
  return t + 60;
};

export const getCurveAddressFromTxRecp = (txRecp: ContractReceipt): string => {
  const abi = ["event NewCurve(address indexed caller, bytes32 indexed id, address indexed curve)"];
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

  if (!events[0]?.args.curve) {
    throw new Error("Unable to find curve address from tx recp");
  }

  return events[0]?.args.curve;
};

export const BN = (a: number | string): BigNumber => {
  return ethers.BigNumber.from(a);
};

export const expectBNAproxEq = (a: BigNumber, b: BigNumber, delta: BigNumber): void => {
  const smallest = b.sub(delta);
  const biggest = b.add(delta);

  expect(a.gte(smallest) && a.lte(biggest)).to.be.equal(
    true,
    `${a.toString()} is not within ${delta.toString()} units from ${b.toString()}`,
  );
};

export const expectBNEq = (a: BigNumber | string, b: BigNumber | string): void => {
  if (!ethers.BigNumber.isBigNumber(a)) {
    expect(BN(a as string).eq(b)).to.be.equal(true, `${BN(a as string).toString()} is not equal to ${b.toString()}`);
  }

  expect((a as BigNumber).eq(b)).to.be.equal(true, `${a.toString()} is not equal to ${b.toString()}`);
};

export const expectEventIn = (txRecp: ContractReceipt, eventName: string, eventArgs: Record<string, unknown>): void => {
  const foundEvents: Result[] = [];

  for (const { event, args } of txRecp.events || []) {
    if (event === eventName && args) {
      foundEvents.push(Object.entries(args));

      let sameArgs = true;

      for (const [k, v] of Object.entries(eventArgs)) {
        if (ethers.BigNumber.isBigNumber(v)) {
          sameArgs = (v as BigNumber).eq(args[k]) && sameArgs;
        } else {
          sameArgs = args[k] === v && sameArgs;
        }
      }

      if (sameArgs) {
        return;
      }
    }
  }

  expect.fail(
    `Event ${eventName} not found with ${JSON.stringify(eventArgs)}, instead found ${JSON.stringify(foundEvents)}`,
  );
};

export const expectRevert = async (promise: Promise<unknown>, expectedError: string): Promise<void> => {
  // eslint-disable-next-line
  promise.catch(() => {}); // Catch all exceptions

  try {
    await promise;
  } catch (error) {
    if (error.message.indexOf(expectedError) === -1) {
      // When the exception was a revert, the resulting string will include only
      // the revert reason, otherwise it will be the type of exception (e.g. 'invalid opcode')
      const actualError = error.message.replace(
        /Returned error: VM Exception while processing transaction: (revert )?/,
        "",
      );
      expect(actualError).to.equal(expectedError, "Wrong kind of exception received");
    }
    return;
  }

  expect.fail("Expected an exception but none was received");
};
