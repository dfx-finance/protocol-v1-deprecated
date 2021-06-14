/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import chai from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../typechain/CurveFactory";
import { Curve } from "../typechain/Curve";
import { ERC20 } from "../typechain/ERC20";
import { Router } from "../typechain/Router";

import { ORACLES, TOKENS } from "./Constants";
import { getFutureTime, expectBNAproxEq, getOracleAnswer } from "./Utils";

import { scaffoldTest, scaffoldHelpers } from "./Setup";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("Router", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let eursToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;
  let trybToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
  let xsgd: ERC20;
  let tryb: ERC20;
  let erc20: ERC20;

  let createCurveAndSetParams: ({
    name,
    symbol,
    base,
    quote,
    baseWeight,
    quoteWeight,
    baseAssimilator,
    quoteAssimilator,
    params,
  }: {
    name: string;
    symbol: string;
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
      trybToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
      cadc,
      eurs,
      xsgd,
      tryb,
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
  beforeEach(async function () {
    const { curve: curveCADC } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: cadc.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.4"),
      quoteWeight: parseUnits("0.6"),
      baseAssimilator: cadcToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });

    const { curve: curveXSGD } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: xsgd.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.4"),
      quoteWeight: parseUnits("0.6"),
      baseAssimilator: xsgdToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });

    const { curve: curveTRYB } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: tryb.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.4"),
      quoteWeight: parseUnits("0.6"),
      baseAssimilator: trybToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });

    const { curve: curveEURS } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
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
      [TOKENS.USDC.address, user1, parseUnits("100000", TOKENS.USDC.decimals), curveTRYB.address],
      [TOKENS.TRYB.address, user1, parseUnits("100000", TOKENS.TRYB.decimals), curveTRYB.address],
    ]);

    await curveCADC
      .connect(user1)
      .deposit(parseUnits("50000"), await getFutureTime())
      .then(x => x.wait());

    await curveXSGD
      .connect(user1)
      .deposit(parseUnits("50000"), await getFutureTime())
      .then(x => x.wait());

    await curveTRYB
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
    expectBNAproxEq(obtained, viewExpected, parseUnits("1", toDecimals));
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

  it("CADC -> TRYB targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.CADC.address,
      toToken: TOKENS.TRYB.address,
      targetAmount: parseUnits("900", TOKENS.TRYB.decimals),
      fromOracle: ORACLES.CADC.address,
      toOracle: ORACLES.TRYB.address,
      fromDecimals: TOKENS.CADC.decimals,
      toDecimals: TOKENS.TRYB.decimals,
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

  it("EURS -> TRYB targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.EURS.address,
      toToken: TOKENS.TRYB.address,
      targetAmount: parseUnits("900", TOKENS.EURS.decimals),
      fromOracle: ORACLES.EURS.address,
      toOracle: ORACLES.TRYB.address,
      fromDecimals: TOKENS.EURS.decimals,
      toDecimals: TOKENS.TRYB.decimals,
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

  it("TRYB -> EURS targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.TRYB.address,
      toToken: TOKENS.EURS.address,
      targetAmount: parseUnits("900", TOKENS.EURS.decimals),
      fromOracle: ORACLES.TRYB.address,
      toOracle: ORACLES.EURS.address,
      fromDecimals: TOKENS.TRYB.decimals,
      toDecimals: TOKENS.EURS.decimals,
    });
  });

  it("TRYB -> CADC targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.TRYB.address,
      toToken: TOKENS.CADC.address,
      targetAmount: parseUnits("900", TOKENS.TRYB.decimals),
      fromOracle: ORACLES.TRYB.address,
      toOracle: ORACLES.CADC.address,
      fromDecimals: TOKENS.TRYB.decimals,
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

  it("USDC -> TRYB originSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.USDC.address,
      toToken: TOKENS.TRYB.address,
      amount: parseUnits("1000", TOKENS.USDC.decimals),
      fromOracle: ORACLES.USDC.address,
      toOracle: ORACLES.TRYB.address,
      fromDecimals: TOKENS.USDC.decimals,
      toDecimals: TOKENS.TRYB.decimals,
    });
  });

  it("CADC -> TRYB originSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.CADC.address,
      toToken: TOKENS.TRYB.address,
      amount: parseUnits("1000", TOKENS.CADC.decimals),
      fromOracle: ORACLES.CADC.address,
      toOracle: ORACLES.TRYB.address,
      fromDecimals: TOKENS.CADC.decimals,
      toDecimals: TOKENS.TRYB.decimals,
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

  it("EURS -> TRYB originSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.EURS.address,
      toToken: TOKENS.TRYB.address,
      amount: parseUnits("1000", TOKENS.EURS.decimals),
      fromOracle: ORACLES.EURS.address,
      toOracle: ORACLES.TRYB.address,
      fromDecimals: TOKENS.EURS.decimals,
      toDecimals: TOKENS.TRYB.decimals,
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

  it("TRYB -> EURS originSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.TRYB.address,
      toToken: TOKENS.EURS.address,
      amount: parseUnits("100", TOKENS.TRYB.decimals),
      fromOracle: ORACLES.TRYB.address,
      toOracle: ORACLES.EURS.address,
      fromDecimals: TOKENS.TRYB.decimals,
      toDecimals: TOKENS.EURS.decimals,
    });
  });

  it("TRYB -> CADC originSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.TRYB.address,
      toToken: TOKENS.CADC.address,
      amount: parseUnits("1000", TOKENS.TRYB.decimals),
      fromOracle: ORACLES.TRYB.address,
      toOracle: ORACLES.CADC.address,
      fromDecimals: TOKENS.TRYB.decimals,
      toDecimals: TOKENS.CADC.decimals,
    });
  });
});
