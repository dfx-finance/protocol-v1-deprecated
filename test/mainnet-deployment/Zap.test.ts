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

  const testZapFunctionality = async (base, quote, baseDecimals, quoteDecimals, curve: Curve, oracle) => {
    await multiMintAndApprove([
      [base, user, parseUnits("100000", baseDecimals), zap.address],
      [quote, user, parseUnits("100000", quoteDecimals), zap.address],
      [base, user, parseUnits("100000", baseDecimals), curve.address],
      [quote, user, parseUnits("100000", quoteDecimals), curve.address],
    ]);

    // Make sure we can zap from a range of values
    for (let i = 1; i <= 100000; i *= 10) {
      if (baseDecimals === 2) {
        if (i === 1) {
          continue;
        }
      }

      const outB = await zap.callStatic.zapFromBase(
        curve.address,
        parseUnits(i.toString(), baseDecimals),
        await getFutureTime(),
        0,
      );

      const outQ = await zap.callStatic.zapFromQuote(
        curve.address,
        parseUnits(i.toString(), quoteDecimals),
        await getFutureTime(),
        0,
      );

      // Always within order of magnitude
      expect(parseFloat(formatUnits(outB))).to.be.gt(i / 2);
      expect(parseFloat(formatUnits(outQ))).to.be.gt(i / 2);
    }
  };

  const testZapCalcDepositLogic = async (base, quote, baseDecimals, quoteDecimals, curve: Curve, oracle) => {
    // Make sure we can zap from a range of values
    for (let i = 1; i <= 100000; i *= 10) {
      const baseAmount = parseUnits(i.toString(), baseDecimals);
      const quoteAmount = parseUnits(i.toString(), quoteDecimals);

      const [depositAmountA, lpsA, amountsA] = await zap.calcMaxDepositAmountGivenBase(curve.address, baseAmount);
      const [depositAmountB, lpsB, amountsB] = await zap.calcMaxDepositAmountGivenQuote(curve.address, quoteAmount);

      if (baseDecimals === 2) {
        expectBNAproxEq(amountsA[0], baseAmount, baseAmount.div(10));
        expectBNAproxEq(amountsB[1], quoteAmount, quoteAmount.div(10));
      } else {
        expectBNAproxEq(amountsA[0], baseAmount, baseAmount.div(1000));
        expectBNAproxEq(amountsB[1], quoteAmount, quoteAmount.div(1000));
      }
    }
  };

  it("CADC", async function () {
    const base = TOKENS.CADC.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.CADC.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveCADC;
    const oracle = ORACLES.EURS.address;

    await testZapFunctionality(base, quote, baseDecimals, quoteDecimals, curve, oracle);
    await testZapCalcDepositLogic(base, quote, baseDecimals, quoteDecimals, curve, oracle);
  });

  it("XSGD", async function () {
    const base = TOKENS.XSGD.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.XSGD.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveXSGD;
    const oracle = ORACLES.EURS.address;

    await testZapFunctionality(base, quote, baseDecimals, quoteDecimals, curve, oracle);
    await testZapCalcDepositLogic(base, quote, baseDecimals, quoteDecimals, curve, oracle);
  });

  it("EURS", async function () {
    const base = TOKENS.EURS.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.EURS.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveEURS;
    const oracle = ORACLES.EURS.address;

    await testZapFunctionality(base, quote, baseDecimals, quoteDecimals, curve, oracle);
    await testZapCalcDepositLogic(base, quote, baseDecimals, quoteDecimals, curve, oracle);
  });
});
