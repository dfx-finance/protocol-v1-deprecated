/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import chai, { expect } from "chai";
import chaiBigNumber from "chai-bignumber";

import { Zap, Curve, CurveFactory, ERC20, Router } from "../../typechain";

import { ORACLES, TOKENS } from "../Constants";
import {
  getFutureTime,
  updateOracleAnswer,
  expectBNAproxEq,
  expectBNEq,
  getOracleAnswer,
  snapshotAndRevert,
  unlockAccountAndGetSigner,
} from "../Utils";

import { formatUnits, namehash, parseUnits } from "ethers/lib/utils";
import { format } from "prettier";
import { scaffoldHelpers, scaffoldTest } from "../Setup";

chai.use(chaiBigNumber(BigNumber));

describe("Zap", function () {
  let [user, user2]: Signer[] = [];
  let [userAddress, user2Address]: string[] = [];
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  let curveCADC: Curve;
  let curveEURS: Curve;
  let curveXSGD: Curve;

  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
  let xsgd: ERC20;
  let erc20: ERC20;

  let zap: Zap;

  before(async function () {
    [user, user2] = await ethers.getSigners();
    [userAddress, user2Address] = await Promise.all([user, user2].map(x => x.getAddress()));

    erc20 = (await ethers.getContractAt("ERC20", ethers.constants.AddressZero)) as ERC20;
    ({ multiMintAndApprove } = await scaffoldHelpers({
      curveFactory: null as CurveFactory,
      erc20,
    }));

    curveCADC = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0xa6c0cbcaebd93ad3c6c94412ec06aaa37870216d",
    )) as Curve;
    curveEURS = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0x1a4Ffe0DCbDB4d551cfcA61A5626aFD190731347",
    )) as Curve;
    curveXSGD = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0x2baB29a12a9527a179Da88F422cDaaA223A90bD5",
    )) as Curve;

    const owner = await unlockAccountAndGetSigner(await curveCADC.owner());

    await curveCADC.connect(owner).turnOffWhitelisting({ gasPrice: 0 });
    await curveEURS.connect(owner).turnOffWhitelisting({ gasPrice: 0 });
    await curveXSGD.connect(owner).turnOffWhitelisting({ gasPrice: 0 });

    const Factory = await ethers.getContractFactory("Zap");
    zap = (await Factory.deploy()) as Zap;
  });

  it("CADC", async function () {
    const base = TOKENS.CADC.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.CADC.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveCADC;

    await multiMintAndApprove([
      [base, user, parseUnits("100000", baseDecimals), zap.address],
      [quote, user, parseUnits("100000", quoteDecimals), zap.address],
    ]);

    const before = await curve.balanceOf(userAddress);
    await zap.zapFromBase(curve.address, parseUnits("10000", baseDecimals), await getFutureTime(), 0);
    const after = await curve.balanceOf(userAddress);

    console.log("delta", formatUnits(after.sub(before)));
  });
});
