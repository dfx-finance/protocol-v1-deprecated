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
      [base, user, parseUnits("100000", baseDecimals), curve.address],
      [quote, user, parseUnits("100000", quoteDecimals), curve.address],
    ]);

    const zapAmount = "20000";
    const before1 = await curve.balanceOf(userAddress);
    await zap.zapFromQuote(curve.address, parseUnits(zapAmount, quoteDecimals), await getFutureTime(), 0);
    const after1 = await curve.balanceOf(userAddress);
    expectBNAproxEq(after1.sub(before1), parseUnits(zapAmount), parseUnits(zapAmount).div(100));

    const maxDeposit1 = await zap.calcMaxDepositAmount(
      curve.address,
      parseUnits("100", baseDecimals),
      parseUnits("10", quoteDecimals),
    );
    expect(maxDeposit1[1][0].lt(parseUnits("100", baseDecimals))).to.be.true;
    expectBNAproxEq(maxDeposit1[1][1], parseUnits("10", quoteDecimals), parseUnits("1", quoteDecimals));

    const maxDeposit2 = await zap.calcMaxDepositAmount(
      curve.address,
      parseUnits("10", baseDecimals),
      parseUnits("100", quoteDecimals),
    );

    console.log("maxDeposit2 base", formatUnits(maxDeposit2[1][0], baseDecimals));
    console.log("maxDeposit2 quote", formatUnits(maxDeposit2[1][1], quoteDecimals));

    expectBNAproxEq(maxDeposit2[1][0], parseUnits("10", baseDecimals), parseUnits("1", baseDecimals));
    expect(maxDeposit2[1][1].lt(parseUnits("100", quoteDecimals))).to.be.true;
  });
});
