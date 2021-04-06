/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import chai, { expect } from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../typechain/CurveFactory";
import { Curve } from "../typechain/Curve";
import { ERC20 } from "../typechain/ERC20";
import { Router } from "../typechain/Router";

import { ORACLES, TOKENS } from "./Constants";
import { getFutureTime, updateOracleAnswer, expectBNAproxEq, expectBNEq, getOracleAnswer } from "./Utils";

import { scaffoldTest, scaffoldHelpers } from "./Setup";
import { formatUnits } from "ethers/lib/utils";
import { format } from "prettier";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("Curve", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let eursToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
  let xsgd: ERC20;
  let erc20: ERC20;

  let createCurveAndSetParams: ({
    base,
    quote,
    baseWeight,
    quoteWeight,
    baseAssimilator,
    quoteAssimilator,
    params,
  }: {
    base: string;
    quote: string;
    baseWeight: BigNumberish;
    quoteWeight: BigNumberish;
    baseAssimilator: string;
    quoteAssimilator: string;
    params: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
  }) => Promise<{
    curve: Curve;
    curveLpToken: ERC20;
  }>;

  let mintAndApprove: (tokenAddress: string, minter: Signer, amount: BigNumberish, recipient: string) => Promise<void>;
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  before(async function () {
    ({
      users: [user1, user2],
      userAddresses: [user1Address, user2Address],
      cadcToUsdAssimilator,
      usdcToUsdAssimilator,
      eursToUsdAssimilator,
      xsgdToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
      cadc,
      eurs,
      xsgd,
      erc20,
    } = await scaffoldTest());
  });

  beforeEach(async function () {
    curveFactory = (await CurveFactory.deploy()) as CurveFactory;
    router = (await RouterFactory.deploy(curveFactory.address)) as Router;

    ({ createCurveAndSetParams, mintAndApprove, multiMintAndApprove } = await scaffoldHelpers({
      curveFactory,
      erc20,
    }));
  });

  describe("Logic", function () {
    it("50/50 supply withdraw", async function () {
      const { curve, curveLpToken } = await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.5"),
        quoteWeight: parseUnits("0.5"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      // Mint tokens and approve
      await multiMintAndApprove([
        [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user1, parseUnits("100", TOKENS.CADC.decimals), curve.address],
        [TOKENS.USDC.address, user2, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user2, parseUnits("100", TOKENS.CADC.decimals), curve.address],
      ]);

      // Before balances
      const beforeCurveUSDC = await usdc.balanceOf(curve.address);
      const beforeUser1USDC = await usdc.balanceOf(user1Address);
      const beforeUser2USDC = await usdc.balanceOf(user2Address);

      const beforeCurveCADC = await cadc.balanceOf(curve.address);
      const beforeUser1CADC = await cadc.balanceOf(user1Address);
      const beforeUser2CADC = await cadc.balanceOf(user2Address);

      // Proportional Deposit
      await curve
        .connect(user1)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());
      await curve
        .connect(user2)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());

      // Get balances again
      const duringCurveUSDC = await usdc.balanceOf(curve.address);
      const duringUser1USDC = await usdc.balanceOf(user1Address);
      const duringUser2USDC = await usdc.balanceOf(user2Address);

      const duringCurveCADC = await cadc.balanceOf(curve.address);
      const duringUser1CADC = await cadc.balanceOf(user1Address);
      const duringUser2CADC = await cadc.balanceOf(user2Address);

      // Withdraw
      await curve.connect(user1).withdraw(await curveLpToken.balanceOf(user1Address), await getFutureTime());
      await curve.connect(user2).withdraw(await curveLpToken.balanceOf(user2Address), await getFutureTime());

      // Get final balances
      const finalCurveUSDC = await usdc.balanceOf(curve.address);
      const finalUser1USDC = await usdc.balanceOf(user1Address);
      const finalUser2USDC = await usdc.balanceOf(user2Address);

      const finalCurveCADC = await cadc.balanceOf(curve.address);
      const finalUser1CADC = await cadc.balanceOf(user1Address);
      const finalUser2CADC = await cadc.balanceOf(user2Address);

      // Initial and final balances should be approx eq
      // Not exactly equal cuz of fees
      expectBNAproxEq(finalUser1USDC, beforeUser1USDC, parseUnits("0.04", TOKENS.USDC.decimals));
      expectBNAproxEq(finalUser1CADC, beforeUser1CADC, parseUnits("0.04", TOKENS.CADC.decimals));

      expectBNAproxEq(finalUser2USDC, beforeUser2USDC, parseUnits("0.04", TOKENS.USDC.decimals));
      expectBNAproxEq(finalUser2CADC, beforeUser2CADC, parseUnits("0.04", TOKENS.CADC.decimals));

      expectBNAproxEq(finalCurveUSDC, beforeCurveUSDC, parseUnits("0.04", TOKENS.USDC.decimals));
      expectBNAproxEq(finalCurveCADC, beforeCurveCADC, parseUnits("0.04", TOKENS.CADC.decimals));

      // Curve should receive roughly 100 USDC in total, since proportional supply
      // supplied 50 USDC + 50 / (CADC/USDC) CADC
      expectBNAproxEq(
        duringCurveUSDC,
        parseUnits("100", TOKENS.USDC.decimals),
        parseUnits("0.04", TOKENS.USDC.decimals),
      );
      expectBNAproxEq(
        duringCurveCADC,
        parseUnits("100", TOKENS.CADC.decimals)
          .mul(parseUnits("1", ORACLES.CADC.decimals))
          .div(await getOracleAnswer(ORACLES.CADC.address)),
        parseUnits("0.04", TOKENS.CADC.decimals),
      );

      // User supplied tokens should be the amount of tokens curve has received / 2
      expectBNAproxEq(
        duringCurveUSDC.div(BigNumber.from(2)),
        beforeUser1USDC.sub(duringUser1USDC),
        parseUnits("0.04", TOKENS.CADC.decimals),
      );
      expectBNAproxEq(
        duringCurveCADC.div(BigNumber.from(2)),
        beforeUser1CADC.sub(duringUser1CADC),
        parseUnits("0.04", TOKENS.CADC.decimals),
      );

      expectBNAproxEq(
        duringCurveUSDC.div(BigNumber.from(2)),
        beforeUser2USDC.sub(duringUser2USDC),
        parseUnits("0.04", TOKENS.CADC.decimals),
      );
      expectBNAproxEq(
        duringCurveCADC.div(BigNumber.from(2)),
        beforeUser2CADC.sub(duringUser2CADC),
        parseUnits("0.04", TOKENS.CADC.decimals),
      );
    });

    it("50/50 - LPs don't get rekt'd on oracle update", async function () {
      const { curve, curveLpToken } = await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.5"),
        quoteWeight: parseUnits("0.5"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      // Mint tokens and approve
      await multiMintAndApprove([
        [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user1, parseUnits("100", TOKENS.CADC.decimals), curve.address],
        [TOKENS.USDC.address, user2, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user2, parseUnits("100", TOKENS.CADC.decimals), curve.address],
      ]);

      // Proportional Deposit
      await curve
        .connect(user1)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());

      // Update oracle
      await updateOracleAnswer(ORACLES.CADC.address, parseUnits("1.2", ORACLES.CADC.decimals));

      await curve
        .connect(user2)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());

      // Number of curve lp tokens should be roughly the same
      const user1CurveLP = await curveLpToken.balanceOf(user1Address);
      const user2CurveLP = await curveLpToken.balanceOf(user1Address);

      expectBNAproxEq(user1CurveLP, user2CurveLP, parseUnits("0.01"));
    });

    it("40/60 LPs don't get rekt'd on oracle update", async function () {
      const { curve, curveLpToken } = await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      // Mint tokens and approve
      await multiMintAndApprove([
        [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user1, parseUnits("100", TOKENS.CADC.decimals), curve.address],
        [TOKENS.USDC.address, user2, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        [TOKENS.CADC.address, user2, parseUnits("100", TOKENS.CADC.decimals), curve.address],
      ]);

      // Proportional Deposit
      await curve
        .connect(user1)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());

      // Update oracle
      await updateOracleAnswer(ORACLES.CADC.address, parseUnits("1.2", ORACLES.CADC.decimals));

      await curve
        .connect(user2)
        .deposit(parseUnits("100"), await getFutureTime())
        .then(x => x.wait());

      // Number of curve lp tokens should be roughly the same
      const user1CurveLP = await curveLpToken.balanceOf(user1Address);
      const user2CurveLP = await curveLpToken.balanceOf(user1Address);

      expectBNAproxEq(user1CurveLP, user2CurveLP, parseUnits("0.01"));
    });

    afterEach(async function () {
      await updateOracleAnswer(ORACLES.CADC.address, parseUnits("0.8", ORACLES.CADC.decimals));
    });
  });

  describe("Oracle updates between operations", function () {
    describe("viewDeposit", function () {
      const viewDepositWithSanityChecks = async ({
        amount,
        base,
        quote,
        baseWeight,
        quoteWeight,
        baseDecimals,
        quoteDecimals,
        baseAssimilator,
        quoteAssimilator,
        params,
        oracle,
      }: {
        amount: string;
        base: string;
        quote: string;
        baseWeight: BigNumberish;
        quoteWeight: BigNumberish;
        baseDecimals: number;
        quoteDecimals: number;
        baseAssimilator: string;
        quoteAssimilator: string;
        params: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
        oracle: string;
      }) => {
        const { curve } = await createCurveAndSetParams({
          base,
          quote,
          baseWeight,
          quoteWeight,
          baseAssimilator,
          quoteAssimilator,
          params,
        });

        // Mint tokens and approve
        await multiMintAndApprove([
          [base, user1, parseUnits("1000000", baseDecimals), curve.address],
          [quote, user1, parseUnits("1000000", quoteDecimals), curve.address],
          [base, user2, parseUnits(amount, baseDecimals), curve.address],
          [quote, user2, parseUnits(amount, quoteDecimals), curve.address],
        ]);

        const depositAmount = parseUnits("1000000");

        // Make sure initial amount is the oracle value
        const ORACLE_RATE = await getOracleAnswer(oracle);

        const [lpAmountUser1, [baseViewUser1, quoteViewUser1]] = await curve.viewDeposit(depositAmount);
        const expectedDepositAmountBase = parseUnits(formatUnits(depositAmount), baseDecimals)
          .mul(1e8)
          .div(ORACLE_RATE)
          .div(2);
        const expectedDepositAmountQuote = parseUnits(formatUnits(depositAmount), quoteDecimals).div(2);

        expectBNAproxEq(baseViewUser1, expectedDepositAmountBase, expectedDepositAmountBase.div(2000));
        expectBNAproxEq(quoteViewUser1, expectedDepositAmountQuote, expectedDepositAmountQuote.div(2000));

        // Deposit user 1
        await curve
          .connect(user1)
          .deposit(depositAmount, await getFutureTime())
          .then(x => x.wait());

        // Update oracle
        const newOracleRate = ORACLE_RATE.mul(100).div(125);
        await updateOracleAnswer(oracle, newOracleRate);

        // View for user 2 should be similar to user 1
        // Regardless of Oracle price
        const [lpAmountUser2, [baseViewUser2, quoteViewUser2]] = await curve.connect(user2).viewDeposit(depositAmount);

        // Even if oracle updates, the deposit amount for user should be relative
        // to the LP pool. Its just the swaps that uses the oracle rate
        expectBNAproxEq(lpAmountUser2, lpAmountUser1, lpAmountUser2.div(2000));
        expectBNAproxEq(quoteViewUser2, quoteViewUser1, quoteViewUser2.div(2000));
        expectBNAproxEq(baseViewUser2, baseViewUser1, baseViewUser2.div(2000));

        await updateOracleAnswer(oracle, ORACLE_RATE);
      };

      for (let i = 1; i <= 10000; i *= 100) {
        it(`CADC/USDC 50/50 - ${i}`, async function () {
          await viewDepositWithSanityChecks({
            amount: i.toString(),
            base: cadc.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.CADC.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: cadcToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.CADC.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it(`XSGD/USDC 50/50 - ${i}`, async function () {
          await viewDepositWithSanityChecks({
            amount: i.toString(),
            base: xsgd.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.XSGD.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: xsgdToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.XSGD.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it(`EURS/USDC 50/50 - ${i}`, async function () {
          await viewDepositWithSanityChecks({
            amount: i.toString(),
            base: eurs.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.EURS.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: eursToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.EURS.address,
          });
        });
      }
    });

    describe("viewWithdraw", function () {
      const viewWithdrawWithSanityChecks = async ({
        amount,
        base,
        quote,
        baseWeight,
        quoteWeight,
        baseDecimals,
        quoteDecimals,
        baseAssimilator,
        quoteAssimilator,
        params,
        oracle,
      }: {
        amount: string;
        base: string;
        quote: string;
        baseWeight: BigNumberish;
        quoteWeight: BigNumberish;
        baseDecimals: number;
        quoteDecimals: number;
        baseAssimilator: string;
        quoteAssimilator: string;
        params: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
        oracle: string;
      }) => {
        const { curve, curveLpToken } = await createCurveAndSetParams({
          base,
          quote,
          baseWeight,
          quoteWeight,
          baseAssimilator,
          quoteAssimilator,
          params,
        });

        // Mint tokens and approve
        await multiMintAndApprove([
          [base, user1, parseUnits("1000000", baseDecimals), curve.address],
          [quote, user1, parseUnits("1000000", quoteDecimals), curve.address],
          [base, user2, parseUnits(amount, baseDecimals), curve.address],
          [quote, user2, parseUnits(amount, quoteDecimals), curve.address],
        ]);

        // Deposit user 1
        await curve
          .connect(user1)
          .deposit(parseUnits("1000000"), await getFutureTime())
          .then(x => x.wait());

        // Deposit for user 2
        const beforeBaseBal = await erc20.attach(base).balanceOf(user2Address);
        const beforeQuoteBal = await erc20.attach(quote).balanceOf(user2Address);
        const beforeLPBal = await curveLpToken.balanceOf(user2Address);
        expectBNEq(beforeLPBal, ethers.constants.Zero);

        await curve
          .connect(user2)
          .deposit(parseUnits(amount), await getFutureTime())
          .then(x => x.wait());

        const afterBaseBal = await erc20.attach(base).balanceOf(user2Address);
        const afterQuoteBal = await erc20.attach(quote).balanceOf(user2Address);

        const afterLPBal = await curveLpToken.balanceOf(user2Address);

        const baseSupplied = beforeBaseBal.sub(afterBaseBal);
        const quoteSupplied = beforeQuoteBal.sub(afterQuoteBal);

        // Withdraw should be the same regardless if oracle updates
        const ORACLE_RATE = await getOracleAnswer(oracle);
        await updateOracleAnswer(oracle, ORACLE_RATE.mul(2));

        const [viewBase, viewQuote] = await curve.viewWithdraw(afterLPBal);

        // Fees take up small portion
        expectBNAproxEq(viewBase, baseSupplied, baseSupplied.div(2000));
        expectBNAproxEq(viewQuote, quoteSupplied, quoteSupplied.div(2000));

        await updateOracleAnswer(oracle, ORACLE_RATE);
      };

      for (let i = 1; i <= 10000; i *= 100) {
        it(`CADC/USDC 50/50 - ${i}`, async function () {
          await viewWithdrawWithSanityChecks({
            amount: i.toString(),
            base: cadc.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.CADC.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: cadcToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.CADC.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it("XSGD/USDC 50/50 - " + i.toString(), async function () {
          await viewWithdrawWithSanityChecks({
            amount: i.toString(),
            base: xsgd.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.XSGD.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: xsgdToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.XSGD.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it("EURS/USDC 50/50 - " + i.toString(), async function () {
          await viewWithdrawWithSanityChecks({
            amount: "10000",
            base: eurs.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.EURS.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: eursToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.XSGD.address,
          });
        });
      }
    });

    describe("Add and remove liquidity", function () {
      const addAndRemoveLiquidityWithSanityChecks = async ({
        amount,
        base,
        quote,
        baseWeight,
        quoteWeight,
        baseDecimals,
        quoteDecimals,
        baseAssimilator,
        quoteAssimilator,
        params,
        oracle,
      }: {
        amount: string;
        base: string;
        quote: string;
        baseWeight: BigNumberish;
        quoteWeight: BigNumberish;
        baseDecimals: number;
        quoteDecimals: number;
        baseAssimilator: string;
        quoteAssimilator: string;
        params: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
        oracle: string;
      }) => {
        const { curve, curveLpToken } = await createCurveAndSetParams({
          base,
          quote,
          baseWeight,
          quoteWeight,
          baseAssimilator,
          quoteAssimilator,
          params,
        });

        // Mint tokens and approve
        await multiMintAndApprove([
          [base, user1, parseUnits("1000000", baseDecimals), curve.address],
          [quote, user1, parseUnits("1000000", quoteDecimals), curve.address],
          [base, user2, parseUnits(amount, baseDecimals), curve.address],
          [quote, user2, parseUnits(amount, quoteDecimals), curve.address],
        ]);

        // Deposit user 1
        await curve
          .connect(user1)
          .deposit(parseUnits("1000000"), await getFutureTime())
          .then(x => x.wait());

        const ORACLE_RATE = await getOracleAnswer(oracle);

        // 1st Deposit for user 2
        let beforeBaseBal = await erc20.attach(base).balanceOf(user2Address);
        let beforeQuoteBal = await erc20.attach(quote).balanceOf(user2Address);
        let beforeLPBal = await curveLpToken.balanceOf(user2Address);
        expectBNEq(beforeLPBal, ethers.constants.Zero);

        await curve
          .connect(user2)
          .deposit(parseUnits(amount), await getFutureTime())
          .then(x => x.wait());

        let afterBaseBal = await erc20.attach(base).balanceOf(user2Address);
        let afterQuoteBal = await erc20.attach(quote).balanceOf(user2Address);
        let afterLPBal = await curveLpToken.balanceOf(user2Address);

        const lpBal = afterLPBal.sub(beforeLPBal);
        const baseSupplied = beforeBaseBal.sub(afterBaseBal);
        const quoteSupplied = beforeQuoteBal.sub(afterQuoteBal);

        expect(afterLPBal.gt(beforeLPBal)).to.be.true;
        expectBNAproxEq(
          baseSupplied,
          parseUnits(amount, baseDecimals).mul(1e8).div(ORACLE_RATE).div(2), // oracle has 8 decimals, we also want to div 2 since we're supplying liquidity
          parseUnits(amount, Math.max(baseDecimals - 4, 0)),
        );
        expectBNAproxEq(quoteSupplied, parseUnits(amount, quoteDecimals).div(2), parseUnits("0.1", baseDecimals));

        // Mint tokens and approve for 2nd deposit
        await multiMintAndApprove([
          [base, user2, parseUnits(amount, baseDecimals), curve.address],
          [quote, user2, parseUnits(amount, quoteDecimals), curve.address],
        ]);
        await updateOracleAnswer(oracle, ORACLE_RATE.mul(2));

        beforeBaseBal = await erc20.attach(base).balanceOf(user2Address);
        beforeQuoteBal = await erc20.attach(quote).balanceOf(user2Address);
        beforeLPBal = await curveLpToken.balanceOf(user2Address);

        await curve
          .connect(user2)
          .deposit(parseUnits(amount), await getFutureTime())
          .then(x => x.wait());

        afterBaseBal = await erc20.attach(base).balanceOf(user2Address);
        afterQuoteBal = await erc20.attach(quote).balanceOf(user2Address);
        afterLPBal = await curveLpToken.balanceOf(user2Address);

        const lpBal2 = afterLPBal.sub(beforeLPBal);
        const baseSupplied2 = beforeBaseBal.sub(afterBaseBal);
        const quoteSupplied2 = beforeQuoteBal.sub(afterQuoteBal);

        expectBNAproxEq(lpBal2, lpBal, lpBal2.div(2000));
        expectBNAproxEq(baseSupplied2, baseSupplied, baseSupplied2.div(2000));
        expectBNAproxEq(quoteSupplied2, quoteSupplied, quoteSupplied2.div(2000));

        // 1st Withdrawal
        await updateOracleAnswer(oracle, ORACLE_RATE);
        beforeBaseBal = await erc20.attach(base).balanceOf(user2Address);
        beforeQuoteBal = await erc20.attach(quote).balanceOf(user2Address);

        await curve
          .connect(user2)
          .withdraw(lpBal, await getFutureTime())
          .then(x => x.wait());

        afterBaseBal = await erc20.attach(base).balanceOf(user2Address);
        afterQuoteBal = await erc20.attach(quote).balanceOf(user2Address);

        const baseReceived = afterBaseBal.sub(beforeBaseBal);
        const quoteReceived = afterQuoteBal.sub(beforeQuoteBal);

        // 2nd Withdrawal
        await updateOracleAnswer(oracle, ORACLE_RATE.mul(2));
        beforeBaseBal = await erc20.attach(base).balanceOf(user2Address);
        beforeQuoteBal = await erc20.attach(quote).balanceOf(user2Address);

        await curve
          .connect(user2)
          .withdraw(lpBal2, await getFutureTime())
          .then(x => x.wait());

        afterBaseBal = await erc20.attach(base).balanceOf(user2Address);
        afterQuoteBal = await erc20.attach(quote).balanceOf(user2Address);

        const baseReceived2 = afterBaseBal.sub(beforeBaseBal);
        const quoteReceived2 = afterQuoteBal.sub(beforeQuoteBal);

        expectBNAproxEq(baseReceived2, baseReceived, baseReceived2.div(2000));
        expectBNAproxEq(quoteReceived2, quoteReceived, quoteReceived2.div(2000));

        // In = Out, regardless of Oracle price
        // As its dependent on LP ratio
        // Has a small fee (0.05%)
        expectBNAproxEq(baseSupplied, baseReceived, baseReceived.div(ethers.BigNumber.from("2000")));
        expectBNAproxEq(quoteSupplied, quoteReceived, quoteReceived.div(ethers.BigNumber.from("2000")));

        expectBNAproxEq(baseSupplied2, baseReceived2, baseReceived2.div(ethers.BigNumber.from("2000")));
        expectBNAproxEq(quoteSupplied2, quoteReceived2, quoteReceived2.div(ethers.BigNumber.from("2000")));

        await updateOracleAnswer(oracle, ORACLE_RATE);
      };

      for (let i = 1; i <= 10000; i *= 100) {
        it("CADC/USDC 50/50 - " + i.toString(), async function () {
          await addAndRemoveLiquidityWithSanityChecks({
            amount: i.toString(),
            base: cadc.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.CADC.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: cadcToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.CADC.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it("XSGD/USDC 50/50 - " + i.toString(), async function () {
          await addAndRemoveLiquidityWithSanityChecks({
            amount: i.toString(),
            base: xsgd.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.XSGD.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: xsgdToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.XSGD.address,
          });
        });
      }

      for (let i = 1; i <= 10000; i *= 100) {
        it("EURS/USDC 50/50 - " + i.toString(), async function () {
          await addAndRemoveLiquidityWithSanityChecks({
            amount: "1",
            base: eurs.address,
            quote: usdc.address,
            baseWeight: parseUnits("0.5"),
            quoteWeight: parseUnits("0.5"),
            baseDecimals: TOKENS.EURS.decimals,
            quoteDecimals: TOKENS.USDC.decimals,
            baseAssimilator: eursToUsdAssimilator.address,
            quoteAssimilator: usdcToUsdAssimilator.address,
            params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
            oracle: ORACLES.EURS.address,
          });
        });
      }
    });
  });

  describe("Swaps", function () {
    const originAndTargetSwapAndCheckSanity = async ({
      base,
      quote,
      baseDecimals,
      quoteDecimals,
      baseWeight,
      quoteWeight,
      baseAssimilator,
      quoteAssimilator,
      params,
      oracle,
    }: {
      base: string;
      quote: string;
      baseDecimals: number;
      quoteDecimals: number;
      baseWeight: BigNumberish;
      quoteWeight: BigNumberish;
      baseAssimilator: string;
      quoteAssimilator: string;
      params: [BigNumberish, BigNumberish, BigNumberish, BigNumberish, BigNumberish];
      oracle: string;
    }) => {
      const { curve } = await createCurveAndSetParams({
        base,
        quote,
        baseWeight,
        quoteWeight,
        baseAssimilator: baseAssimilator,
        quoteAssimilator: quoteAssimilator,
        params: params,
      });

      // Mint tokens and approve
      await multiMintAndApprove([
        [base, user1, parseUnits("1000", baseDecimals), curve.address],
        [quote, user1, parseUnits("1000", quoteDecimals), curve.address],
      ]);

      // Proportional Supply
      await curve.deposit(parseUnits("200"), await getFutureTime());

      // Swap
      let beforeBase = await erc20.attach(base).balanceOf(user1Address);
      let beforeQuote = await erc20.attach(quote).balanceOf(user1Address);

      let tx = await curve.originSwap(base, quote, parseUnits("1", baseDecimals), 0, await getFutureTime());
      await tx.wait();

      let afterBase = await erc20.attach(base).balanceOf(user1Address);
      let afterQuote = await erc20.attach(quote).balanceOf(user1Address);

      // Calculate expected CADC
      const ORACLE_RATE = await getOracleAnswer(oracle);
      const expectedQuote = ORACLE_RATE.div(parseUnits("100", 0));

      // Get back roughly 1 (fees make it not exactly 1)
      expectBNAproxEq(beforeBase.sub(afterBase), parseUnits("1", baseDecimals), parseUnits("0.04", baseDecimals));
      expectBNAproxEq(afterQuote.sub(beforeQuote), expectedQuote, parseUnits("0.04", quoteDecimals));

      // Target Swap
      beforeBase = await erc20.attach(base).balanceOf(user1Address);
      beforeQuote = await erc20.attach(quote).balanceOf(user1Address);

      tx = await curve.targetSwap(
        quote,
        base,
        parseUnits("5", quoteDecimals),
        parseUnits("1", baseDecimals).mul(parseUnits("1", 8)).div(ORACLE_RATE), // Oracle decimals is always 8
        await getFutureTime(),
      );
      await tx.wait();

      afterBase = await erc20.attach(base).balanceOf(user1Address);
      afterQuote = await erc20.attach(quote).balanceOf(user1Address);

      // Target swap works as intended
      expectBNAproxEq(afterBase.sub(beforeBase), parseUnits("1", baseDecimals), parseUnits("0.04", baseDecimals));
      expectBNAproxEq(beforeQuote.sub(afterQuote), parseUnits("1", quoteDecimals), parseUnits("0.04", quoteDecimals));
    };

    it("CADC/USDC 50/50 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: cadc.address,
        quote: usdc.address,
        baseDecimals: TOKENS.CADC.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.5"),
        quoteWeight: parseUnits("0.5"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.CADC.address,
      });
    });

    it("CADC/USDC 40/60 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: cadc.address,
        quote: usdc.address,
        baseDecimals: TOKENS.CADC.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.CADC.address,
      });
    });

    it("XSGD/USDC 50/50 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: xsgd.address,
        quote: usdc.address,
        baseDecimals: TOKENS.XSGD.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.5"),
        quoteWeight: parseUnits("0.5"),
        baseAssimilator: xsgdToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.XSGD.address,
      });
    });

    it("XSGD/USDC 40/60 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: xsgd.address,
        quote: usdc.address,
        baseDecimals: TOKENS.XSGD.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: xsgdToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.XSGD.address,
      });
    });

    it("EURS/USDC 50/50 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: eurs.address,
        quote: usdc.address,
        baseDecimals: TOKENS.EURS.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.5"),
        quoteWeight: parseUnits("0.5"),
        baseAssimilator: eursToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.EURS.address,
      });
    });

    it("EURS/USDC 40/60 - originSwap and targetSwap", async function () {
      await originAndTargetSwapAndCheckSanity({
        base: eurs.address,
        quote: usdc.address,
        baseDecimals: TOKENS.EURS.decimals,
        quoteDecimals: TOKENS.USDC.decimals,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: eursToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        oracle: ORACLES.EURS.address,
      });
    });
  });
});
