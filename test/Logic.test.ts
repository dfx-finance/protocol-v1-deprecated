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
import {
  mintCADC,
  mintUSDC,
  mintEURS,
  mintXSGD,
  getFutureTime,
  updateOracleAnswer,
  expectBNAproxEq,
  expectBNEq,
  getOracleAnswer,
} from "./Utils";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits, formatUnits } = ethers.utils;

const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("Curve", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let CurvesLib: ContractFactory;
  let OrchestratorLib: ContractFactory;
  let ProportionalLiquidityLib: ContractFactory;
  let SwapsLib: ContractFactory;
  let ViewLiquidityLib: ContractFactory;

  let CadcToUsdAssimilator: ContractFactory;
  let UsdcToUsdAssimilator: ContractFactory;
  let EursToUsdAssimilator: ContractFactory;
  let XsgdToUsdAssimilator: ContractFactory;

  let curvesLib: Contract;
  let orchestratorLib: Contract;
  let proportionalLiquidityLib: Contract;
  let swapsLib: Contract;
  let viewLiquidityLib: Contract;

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let eursToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: Contract;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
  let xsgd: ERC20;
  let erc20: ERC20;

  const logTokenBalances = async (address: string) => {
    console.log("--------------------");
    console.log("usdc balance", formatUnits(await usdc.balanceOf(address), TOKENS.USDC.decimals));
    console.log("cadc balance", formatUnits(await cadc.balanceOf(address), TOKENS.CADC.decimals));
    console.log("eurs balance", formatUnits(await eurs.balanceOf(address), TOKENS.EURS.decimals));
    console.log("xsgd balance", formatUnits(await xsgd.balanceOf(address), TOKENS.XSGD.decimals));
    console.log("--------------------");
  };

  before(async function () {
    [user1, user2] = await ethers.getSigners();
    [user1Address, user2Address] = await Promise.all([user1, user2].map(x => x.getAddress()));

    CurvesLib = await ethers.getContractFactory("Curves");
    OrchestratorLib = await ethers.getContractFactory("Orchestrator");
    ProportionalLiquidityLib = await ethers.getContractFactory("ProportionalLiquidity");
    SwapsLib = await ethers.getContractFactory("Swaps");
    ViewLiquidityLib = await ethers.getContractFactory("ViewLiquidity");

    curvesLib = await CurvesLib.deploy();
    orchestratorLib = await OrchestratorLib.deploy();
    proportionalLiquidityLib = await ProportionalLiquidityLib.deploy();
    swapsLib = await SwapsLib.deploy();
    viewLiquidityLib = await ViewLiquidityLib.deploy();

    CadcToUsdAssimilator = await ethers.getContractFactory("CadcToUsdAssimilator");
    UsdcToUsdAssimilator = await ethers.getContractFactory("UsdcToUsdAssimilator");
    EursToUsdAssimilator = await ethers.getContractFactory("EursToUsdAssimilator");
    XsgdToUsdAssimilator = await ethers.getContractFactory("XsgdToUsdAssimilator");

    cadcToUsdAssimilator = await CadcToUsdAssimilator.deploy();
    usdcToUsdAssimilator = await UsdcToUsdAssimilator.deploy();
    eursToUsdAssimilator = await EursToUsdAssimilator.deploy();
    xsgdToUsdAssimilator = await XsgdToUsdAssimilator.deploy();

    usdc = (await ethers.getContractAt("ERC20", TOKENS.USDC.address)) as ERC20;
    cadc = (await ethers.getContractAt("ERC20", TOKENS.CADC.address)) as ERC20;
    eurs = (await ethers.getContractAt("ERC20", TOKENS.EURS.address)) as ERC20;
    xsgd = (await ethers.getContractAt("ERC20", TOKENS.XSGD.address)) as ERC20;

    erc20 = (await ethers.getContractAt("ERC20", ethers.constants.AddressZero)) as ERC20;

    CurveFactory = await ethers.getContractFactory("CurveFactory", {
      libraries: {
        Curves: curvesLib.address,
        Orchestrator: orchestratorLib.address,
        ProportionalLiquidity: proportionalLiquidityLib.address,
        Swaps: swapsLib.address,
        ViewLiquidity: viewLiquidityLib.address,
      },
    });

    RouterFactory = await ethers.getContractFactory("Router");
  });

  beforeEach(async function () {
    curveFactory = (await CurveFactory.deploy()) as CurveFactory;
    router = (await RouterFactory.deploy(curveFactory.address)) as Router;
  });

  const createCurve = async function ({
    base,
    quote,
    baseWeight,
    quoteWeight,
    baseAssimilator,
    quoteAssimilator,
  }: {
    base: string;
    quote: string;
    baseWeight: BigNumberish;
    quoteWeight: BigNumberish;
    baseAssimilator: string;
    quoteAssimilator: string;
  }): Promise<{ curve: Curve; curveLpToken: ERC20 }> {
    let tx = await curveFactory.newCurve(base, quote, baseWeight, quoteWeight, baseAssimilator, quoteAssimilator);
    const txRecp = await tx.wait();

    // Get curve address
    const curveAddress = await curveFactory.curves(
      ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address", "address"], [base, quote])),
    );
    const curveLpToken = (await ethers.getContractAt("ERC20", curveAddress)) as ERC20;
    const curve = (await ethers.getContractAt("Curve", curveAddress)) as Curve;

    // Set params for the curve
    tx = await curve.setParams(ALPHA, BETA, MAX, EPSILON, LAMBDA);
    await tx.wait();

    return {
      curve,
      curveLpToken,
    };
  };

  const createCurveAndSetParams = async function ({
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
  }) {
    const { curve, curveLpToken } = await createCurve({
      base,
      quote,
      baseWeight,
      quoteWeight,
      baseAssimilator,
      quoteAssimilator,
    });

    const tx = await curve.setParams(...params);
    await tx.wait();

    return {
      curve,
      curveLpToken,
    };
  };

  const mintAndApprove = async function (
    tokenAddress: string,
    minter: Signer,
    amount: BigNumberish,
    recipient: string,
  ) {
    const minterAddress = await minter.getAddress();

    if (tokenAddress.toLowerCase() === TOKENS.USDC.address.toLowerCase()) {
      await mintUSDC(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.CADC.address.toLowerCase()) {
      await mintCADC(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.EURS.address.toLowerCase()) {
      await mintEURS(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.XSGD.address.toLowerCase()) {
      await mintXSGD(minterAddress, amount);
    }

    await erc20.attach(tokenAddress).connect(minter).approve(recipient, amount);
  };

  const multiMintAndApprove = async function (requests: [string, Signer, BigNumberish, string][]) {
    for (let i = 0; i < requests.length; i++) {
      await mintAndApprove(...requests[i]);
    }
  };

  describe("Curve", async function () {
    describe("Proportional", async function () {
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

    describe("viewDeposit", function () {
      it("CADC <> USDC", async function () {
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
          [TOKENS.CADC.address, user1, parseUnits("100", TOKENS.CADC.decimals), curve.address],
          [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        ]);

        const beforeUser1USDC = await usdc.balanceOf(user1Address);
        const beforeUser1CADC = await cadc.balanceOf(user1Address);

        // Proportional Deposit
        await curve
          .connect(user1)
          .deposit(parseUnits("100"), await getFutureTime())
          .then(x => x.wait());

        const afterUser1USDC = await usdc.balanceOf(user1Address);
        const afterUser1CADC = await cadc.balanceOf(user1Address);

        // Balance of LP Tokens
        const deltaLP = await curveLpToken.balanceOf(user1Address);
        const deltaUSDC = beforeUser1USDC.sub(afterUser1USDC);
        const deltaCADC = beforeUser1CADC.sub(afterUser1CADC);

        const deposits = await curve.viewDeposit(parseUnits("100"));

        expectBNAproxEq(deltaLP, deposits[0], parseUnits("1", 15));
        expectBNAproxEq(deltaUSDC, deposits[1][1], parseUnits("1", 2));
        expectBNAproxEq(deltaCADC, deposits[1][0], parseUnits("1", 15));
      });

      it("XSGD <> USDC", async function () {
        const { curve, curveLpToken } = await createCurveAndSetParams({
          base: xsgd.address,
          quote: usdc.address,
          baseWeight: parseUnits("0.5"),
          quoteWeight: parseUnits("0.5"),
          baseAssimilator: xsgdToUsdAssimilator.address,
          quoteAssimilator: usdcToUsdAssimilator.address,
          params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        });

        // Mint tokens and approve
        await multiMintAndApprove([
          [TOKENS.XSGD.address, user1, parseUnits("100", TOKENS.XSGD.decimals), curve.address],
          [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        ]);

        const beforeUser1USDC = await usdc.balanceOf(user1Address);
        const beforeUser1XSGD = await xsgd.balanceOf(user1Address);

        // Proportional Deposit
        await curve
          .connect(user1)
          .deposit(parseUnits("100"), await getFutureTime())
          .then(x => x.wait());

        const afterUser1USDC = await usdc.balanceOf(user1Address);
        const afterUser1XSGD = await xsgd.balanceOf(user1Address);

        // Balance of LP Tokens
        const deltaLP = await curveLpToken.balanceOf(user1Address);
        const deltaUSDC = beforeUser1USDC.sub(afterUser1USDC);
        const deltaXSGD = beforeUser1XSGD.sub(afterUser1XSGD);

        const deposits = await curve.viewDeposit(parseUnits("100"));

        expectBNAproxEq(deltaLP, deposits[0], parseUnits("1", 2));
        expectBNAproxEq(deltaUSDC, deposits[1][1], parseUnits("1", 2));
        expectBNAproxEq(deltaXSGD, deposits[1][0], parseUnits("1", 2));
      });

      it("EURS <> USDC", async function () {
        const { curve, curveLpToken } = await createCurveAndSetParams({
          base: eurs.address,
          quote: usdc.address,
          baseWeight: parseUnits("0.5"),
          quoteWeight: parseUnits("0.5"),
          baseAssimilator: eursToUsdAssimilator.address,
          quoteAssimilator: usdcToUsdAssimilator.address,
          params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
        });

        // Mint tokens and approve
        await multiMintAndApprove([
          [TOKENS.EURS.address, user1, parseUnits("100", TOKENS.EURS.decimals), curve.address],
          [TOKENS.USDC.address, user1, parseUnits("100", TOKENS.USDC.decimals), curve.address],
        ]);

        const beforeUser1USDC = await usdc.balanceOf(user1Address);
        const beforeUser1EURS = await eurs.balanceOf(user1Address);

        // Proportional Deposit
        await curve
          .connect(user1)
          .deposit(parseUnits("100"), await getFutureTime())
          .then(x => x.wait());

        const afterUser1USDC = await usdc.balanceOf(user1Address);
        const afterUser1EURS = await eurs.balanceOf(user1Address);

        // Balance of LP Tokens
        const deltaLP = await curveLpToken.balanceOf(user1Address);
        const deltaUSDC = beforeUser1USDC.sub(afterUser1USDC);
        const deltaEURS = beforeUser1EURS.sub(afterUser1EURS);

        const deposits = await curve.viewDeposit(parseUnits("100"));

        expectBNAproxEq(deltaLP, deposits[0], parseUnits("1", 2));
        expectBNAproxEq(deltaUSDC, deposits[1][1], parseUnits("1", 0));
        expectBNAproxEq(deltaEURS, deposits[1][0], parseUnits("1", 0));
      });
    });

    describe("Swaps", async function () {
      it("50/50 - originSwap and targetSwap", async function () {
        const { curve } = await createCurveAndSetParams({
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
          [TOKENS.USDC.address, user1, parseUnits("1000", TOKENS.USDC.decimals), curve.address],
          [TOKENS.CADC.address, user1, parseUnits("1000", TOKENS.CADC.decimals), curve.address],
        ]);

        // Proportional Supply
        await curve.deposit(parseUnits("200"), await getFutureTime());

        // Swap
        let beforeUSDC = await usdc.balanceOf(user1Address);
        let beforeCADC = await cadc.balanceOf(user1Address);

        let tx = await curve.originSwap(
          cadc.address,
          usdc.address,
          parseUnits("1", TOKENS.CADC.decimals),
          0,
          await getFutureTime(),
        );
        await tx.wait();

        let afterUSDC = await usdc.balanceOf(user1Address);
        let afterCADC = await cadc.balanceOf(user1Address);

        // Calculate expected CADC
        const CADC_USDC_RATE8 = await getOracleAnswer(ORACLES.CADC.address);
        const expectedUSDC6 = CADC_USDC_RATE8.div(parseUnits("100", 0));

        // Get back roughly 1 (fees make it not exactly 1)
        expectBNAproxEq(beforeCADC.sub(afterCADC), parseUnits("1", TOKENS.CADC.decimals), parseUnits("0.04"));
        expectBNAproxEq(afterUSDC.sub(beforeUSDC), expectedUSDC6, parseUnits("0.04", TOKENS.USDC.decimals));

        // Target Swap
        beforeUSDC = await usdc.balanceOf(user1Address);
        beforeCADC = await cadc.balanceOf(user1Address);

        tx = await curve.targetSwap(
          usdc.address,
          cadc.address,
          parseUnits("5", TOKENS.USDC.decimals),
          parseUnits("1", TOKENS.CADC.decimals).mul(parseUnits("1", 8)).div(CADC_USDC_RATE8),
          await getFutureTime(),
        );
        await tx.wait();

        afterUSDC = await usdc.balanceOf(user1Address);
        afterCADC = await cadc.balanceOf(user1Address);

        // Target swap works as intended
        expectBNAproxEq(afterCADC.sub(beforeCADC), parseUnits("1", TOKENS.CADC.decimals), parseUnits("0.04"));
        expectBNAproxEq(beforeUSDC.sub(afterUSDC), expectedUSDC6, parseUnits("0.04"));
      });

      it("40/60 - originSwap and targetSwap", async function () {
        const { curve } = await createCurveAndSetParams({
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
          [TOKENS.USDC.address, user1, parseUnits("1000", TOKENS.USDC.decimals), curve.address],
          [TOKENS.CADC.address, user1, parseUnits("1000", TOKENS.CADC.decimals), curve.address],
        ]);

        // Proportional Supply
        await curve.deposit(parseUnits("200"), await getFutureTime());

        // Swap
        let beforeUSDC = await usdc.balanceOf(user1Address);
        let beforeCADC = await cadc.balanceOf(user1Address);

        let tx = await curve.originSwap(
          cadc.address,
          usdc.address,
          parseUnits("1", TOKENS.CADC.decimals),
          0,
          await getFutureTime(),
        );
        await tx.wait();

        let afterUSDC = await usdc.balanceOf(user1Address);
        let afterCADC = await cadc.balanceOf(user1Address);

        // Calculate expected CADC
        const CADC_USDC_RATE8 = await getOracleAnswer(ORACLES.CADC.address);
        const expectedUSDC6 = CADC_USDC_RATE8.div(parseUnits("100", 0));

        // Get back roughly 1 (fees make it not exactly 1)
        expectBNAproxEq(beforeCADC.sub(afterCADC), parseUnits("1", TOKENS.CADC.decimals), parseUnits("0.04"));
        expectBNAproxEq(afterUSDC.sub(beforeUSDC), expectedUSDC6, parseUnits("0.04", TOKENS.USDC.decimals));

        // Target Swap
        beforeUSDC = await usdc.balanceOf(user1Address);
        beforeCADC = await cadc.balanceOf(user1Address);

        tx = await curve.targetSwap(
          usdc.address,
          cadc.address,
          parseUnits("5", TOKENS.USDC.decimals),
          parseUnits("1", TOKENS.CADC.decimals).mul(parseUnits("1", 8)).div(CADC_USDC_RATE8),
          await getFutureTime(),
        );
        await tx.wait();

        afterUSDC = await usdc.balanceOf(user1Address);
        afterCADC = await cadc.balanceOf(user1Address);

        // Target swap works as intended
        expectBNAproxEq(afterCADC.sub(beforeCADC), parseUnits("1", TOKENS.CADC.decimals), parseUnits("0.04"));
        expectBNAproxEq(beforeUSDC.sub(afterUSDC), expectedUSDC6, parseUnits("0.04"));
      });
    });
  });

  describe("Factory", function () {
    it("No duplicate pairs", async function () {
      const { curve } = await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      const curveCadcUsdcAddress = await curveFactory.curves(
        ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [cadc.address, usdc.address]),
        ),
      );

      expect(curve.address.toLowerCase()).to.be.eq(curveCadcUsdcAddress.toLowerCase());
    });
  });

  describe("Router", function () {
    beforeEach(async function () {
      const { curve: curveCADC } = await createCurveAndSetParams({
        base: cadc.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: cadcToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      const { curve: curveXSGD } = await createCurveAndSetParams({
        base: xsgd.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: xsgdToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      const { curve: curveEURS } = await createCurveAndSetParams({
        base: eurs.address,
        quote: usdc.address,
        baseWeight: parseUnits("0.4"),
        quoteWeight: parseUnits("0.6"),
        baseAssimilator: eursToUsdAssimilator.address,
        quoteAssimilator: usdcToUsdAssimilator.address,
        params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      });

      // Supply liquidity to the pools
      // Mint tokens and approve
      await multiMintAndApprove([
        [TOKENS.USDC.address, user1, parseUnits("100000", TOKENS.USDC.decimals), curveCADC.address],
        [TOKENS.CADC.address, user1, parseUnits("100000", TOKENS.CADC.decimals), curveCADC.address],
        [TOKENS.USDC.address, user1, parseUnits("100000", TOKENS.USDC.decimals), curveXSGD.address],
        [TOKENS.XSGD.address, user1, parseUnits("100000", TOKENS.XSGD.decimals), curveXSGD.address],
        [TOKENS.USDC.address, user1, parseUnits("100000", TOKENS.USDC.decimals), curveEURS.address],
        [TOKENS.EURS.address, user1, parseUnits("100000", TOKENS.EURS.decimals), curveEURS.address],
      ]);

      await curveCADC
        .connect(user1)
        .deposit(parseUnits("50000"), await getFutureTime())
        .then(x => x.wait());

      await curveXSGD
        .connect(user1)
        .deposit(parseUnits("50000"), await getFutureTime())
        .then(x => x.wait());

      await curveEURS
        .connect(user1)
        .deposit(parseUnits("50000"), await getFutureTime())
        .then(x => x.wait());
    });

    const routerOriginSwapAndCheck = async ({
      user,
      fromToken,
      toToken,
      amount,
      fromOracle,
      toOracle,
      fromDecimals,
      toDecimals,
    }: {
      user: Signer;
      fromToken: string;
      toToken: string;
      amount: BigNumber;
      fromOracle: string;
      toOracle: string;
      fromDecimals: number;
      toDecimals: number;
    }) => {
      const userAddress = await user.getAddress();
      await mintAndApprove(fromToken, user, amount, router.address);
      const beforeAmnt = await erc20.attach(toToken).balanceOf(userAddress);

      const viewExpected = await router.connect(user).viewOriginSwap(TOKENS.USDC.address, fromToken, toToken, amount);

      await router.connect(user).originSwap(TOKENS.USDC.address, fromToken, toToken, amount, 0, await getFutureTime());
      const afterAmnt = await erc20.attach(toToken).balanceOf(userAddress);

      // Get oracle rates
      const FROM_RATE8 = await getOracleAnswer(fromOracle);
      const TO_RATE8 = await getOracleAnswer(toOracle);

      const obtained = afterAmnt.sub(beforeAmnt);
      let expected = amount.mul(FROM_RATE8).div(TO_RATE8);

      if (fromDecimals - toDecimals < 0) {
        expected = expected.mul(parseUnits("1", toDecimals - fromDecimals));
      } else {
        expected = expected.div(parseUnits("1", fromDecimals - toDecimals));
      }

      expectBNAproxEq(obtained, expected, parseUnits("2", toDecimals));
      expectBNAproxEq(obtained, viewExpected, parseUnits("0.1", toDecimals));
    };

    const routerViewTargetSwapAndCheck = async ({
      user,
      fromToken,
      toToken,
      targetAmount,
      fromOracle,
      toOracle,
      fromDecimals,
      toDecimals,
    }: {
      user: Signer;
      fromToken: string;
      toToken: string;
      targetAmount: BigNumber;
      fromOracle: string;
      toOracle: string;
      fromDecimals: number;
      toDecimals: number;
    }) => {
      // Get oracle rates
      const FROM_RATE8 = await getOracleAnswer(fromOracle);
      const TO_RATE8 = await getOracleAnswer(toOracle);

      const sent = await router.connect(user).viewTargetSwap(TOKENS.USDC.address, fromToken, toToken, targetAmount);

      let expected = targetAmount.mul(TO_RATE8).div(FROM_RATE8);

      if (toDecimals - fromDecimals < 0) {
        expected = expected.mul(parseUnits("1", fromDecimals - toDecimals));
      } else {
        expected = expected.div(parseUnits("1", toDecimals - fromDecimals));
      }

      expectBNAproxEq(sent, expected, parseUnits("2", fromDecimals));
    };

    it("CADC -> USDC targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.USDC.address,
        targetAmount: parseUnits("900", TOKENS.USDC.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.USDC.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.USDC.decimals,
      });
    });

    it("USDC -> CADC targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.USDC.address,
        toToken: TOKENS.CADC.address,
        targetAmount: parseUnits("900", TOKENS.USDC.decimals),
        fromOracle: ORACLES.USDC.address,
        toOracle: ORACLES.CADC.address,
        fromDecimals: TOKENS.USDC.decimals,
        toDecimals: TOKENS.CADC.decimals,
      });
    });

    it("CADC -> XSGD targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.XSGD.address,
        targetAmount: parseUnits("900", TOKENS.XSGD.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.XSGD.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.XSGD.decimals,
      });
    });

    it("CADC -> EURS targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.EURS.address,
        targetAmount: parseUnits("900", TOKENS.EURS.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.EURS.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.EURS.decimals,
      });
    });

    it("EURS -> XSGD targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.EURS.address,
        toToken: TOKENS.XSGD.address,
        targetAmount: parseUnits("900", TOKENS.EURS.decimals),
        fromOracle: ORACLES.EURS.address,
        toOracle: ORACLES.XSGD.address,
        fromDecimals: TOKENS.EURS.decimals,
        toDecimals: TOKENS.XSGD.decimals,
      });
    });

    it("XSGD -> EURS targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.XSGD.address,
        toToken: TOKENS.EURS.address,
        targetAmount: parseUnits("900", TOKENS.EURS.decimals),
        fromOracle: ORACLES.XSGD.address,
        toOracle: ORACLES.EURS.address,
        fromDecimals: TOKENS.XSGD.decimals,
        toDecimals: TOKENS.EURS.decimals,
      });
    });

    it("XSGD -> CADC targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.XSGD.address,
        toToken: TOKENS.CADC.address,
        targetAmount: parseUnits("900", TOKENS.XSGD.decimals),
        fromOracle: ORACLES.XSGD.address,
        toOracle: ORACLES.CADC.address,
        fromDecimals: TOKENS.XSGD.decimals,
        toDecimals: TOKENS.CADC.decimals,
      });
    });

    it("EURS -> CADC targetSwap", async function () {
      await routerViewTargetSwapAndCheck({
        user: user2,
        fromToken: TOKENS.EURS.address,
        toToken: TOKENS.CADC.address,
        targetAmount: parseUnits("900", TOKENS.EURS.decimals),
        fromOracle: ORACLES.EURS.address,
        toOracle: ORACLES.CADC.address,
        fromDecimals: TOKENS.EURS.decimals,
        toDecimals: TOKENS.CADC.decimals,
      });
    });

    it("CADC -> USDC originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.USDC.address,
        amount: parseUnits("1000", TOKENS.CADC.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.USDC.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.USDC.decimals,
      });
    });

    it("USDC -> XSGD originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.USDC.address,
        toToken: TOKENS.XSGD.address,
        amount: parseUnits("1000", TOKENS.USDC.decimals),
        fromOracle: ORACLES.USDC.address,
        toOracle: ORACLES.XSGD.address,
        fromDecimals: TOKENS.USDC.decimals,
        toDecimals: TOKENS.XSGD.decimals,
      });
    });

    it("CADC -> XSGD originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.XSGD.address,
        amount: parseUnits("1000", TOKENS.CADC.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.XSGD.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.XSGD.decimals,
      });
    });

    it("CADC -> EURS originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.CADC.address,
        toToken: TOKENS.EURS.address,
        amount: parseUnits("1000", TOKENS.CADC.decimals),
        fromOracle: ORACLES.CADC.address,
        toOracle: ORACLES.EURS.address,
        fromDecimals: TOKENS.CADC.decimals,
        toDecimals: TOKENS.EURS.decimals,
      });
    });

    it("EURS -> XSGD originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.EURS.address,
        toToken: TOKENS.XSGD.address,
        amount: parseUnits("1000", TOKENS.EURS.decimals),
        fromOracle: ORACLES.EURS.address,
        toOracle: ORACLES.XSGD.address,
        fromDecimals: TOKENS.EURS.decimals,
        toDecimals: TOKENS.XSGD.decimals,
      });
    });

    it("EURS -> CADC originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.EURS.address,
        toToken: TOKENS.CADC.address,
        amount: parseUnits("1000", TOKENS.EURS.decimals),
        fromOracle: ORACLES.EURS.address,
        toOracle: ORACLES.CADC.address,
        fromDecimals: TOKENS.EURS.decimals,
        toDecimals: TOKENS.CADC.decimals,
      });
    });

    it("XSGD -> EURS originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.XSGD.address,
        toToken: TOKENS.EURS.address,
        amount: parseUnits("100", TOKENS.XSGD.decimals),
        fromOracle: ORACLES.XSGD.address,
        toOracle: ORACLES.EURS.address,
        fromDecimals: TOKENS.XSGD.decimals,
        toDecimals: TOKENS.EURS.decimals,
      });
    });

    it("XSGD -> CADC originSwap", async function () {
      await routerOriginSwapAndCheck({
        user: user2,
        fromToken: TOKENS.XSGD.address,
        toToken: TOKENS.CADC.address,
        amount: parseUnits("1000", TOKENS.XSGD.decimals),
        fromOracle: ORACLES.XSGD.address,
        toOracle: ORACLES.CADC.address,
        fromDecimals: TOKENS.XSGD.decimals,
        toDecimals: TOKENS.CADC.decimals,
      });
    });
  });
});
