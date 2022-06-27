/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import { formatUnits } from "ethers/lib/utils";
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
  let nzdsToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;
  let curvenNZDS: Contract;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let nzds: ERC20;
  let xsgd: ERC20;
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
      nzdsToUsdAssimilator,
      xsgdToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
      cadc,
      nzds,
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
  beforeEach(async function () {
    ({ curve: curvenNZDS } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: nzds.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.7"),
      quoteWeight: parseUnits("0.3"),
      baseAssimilator: nzdsToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    }));
    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("30000000000", TOKENS.USDC.decimals), curvenNZDS.address],
      [TOKENS.NZDS.address, user1, parseUnits("30000000000", TOKENS.NZDS.decimals), curvenNZDS.address],
    ]);

    await curvenNZDS
      .connect(user1)
      .deposit(parseUnits("118420"), await getFutureTime())
      .then(x => x.wait());
    await poolStats(usdc, nzds, curvenNZDS);
  });

  const poolStats = async (usdc: Contract, forexTokenContract: Contract, pool: Contract) => {
    const rawTotalSupply = await pool.totalSupply();
    const totalSupply = formatUnits(rawTotalSupply);

    const rawLiq = await pool.liquidity();
    const totalValueUsd = formatUnits(rawLiq[0], 18);
    const trybValueUsd = formatUnits(rawLiq[1][0], 18);
    const usdcValueUsd = formatUnits(rawLiq[1][1], 18);
    const trybRatio = Number(trybValueUsd) / Number(totalValueUsd);
    console.log("\nTotal LPT:", totalSupply);
    console.log("Pool TRYB ratio:", trybRatio);
  };

  const tokenStats = async (user: Signer) => {
    console.log("USDC: ", (await usdc.balanceOf(await user.getAddress())).toString());
    console.log("NZDS: ", (await nzds.balanceOf(await user.getAddress())).toString());
  };

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
    await mintAndApprove(fromToken, user, amount, router.address);

    await router.connect(user).originSwap(TOKENS.USDC.address, fromToken, toToken, amount, 0, await getFutureTime());
  };

  it("CADC -> USDC targetSwap", async function () {
    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.NZDS.address,
      toToken: TOKENS.USDC.address,
      amount: parseUnits("26000", TOKENS.NZDS.decimals),
      fromOracle: ORACLES.NZDS.address,
      toOracle: ORACLES.USDC.address,
      fromDecimals: TOKENS.NZDS.decimals,
      toDecimals: TOKENS.USDC.decimals,
    });
    await poolStats(usdc, nzds, curvenNZDS);

    await curvenNZDS
      .connect(user1)
      .deposit(parseUnits("2000000000"), await getFutureTime())
      .then(x => x.wait());
    await poolStats(usdc, nzds, curvenNZDS);

    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.NZDS.address,
      toToken: TOKENS.USDC.address,
      amount: parseUnits("2600000", TOKENS.NZDS.decimals),
      fromOracle: ORACLES.NZDS.address,
      toOracle: ORACLES.USDC.address,
      fromDecimals: TOKENS.NZDS.decimals,
      toDecimals: TOKENS.USDC.decimals,
    });
    await poolStats(usdc, nzds, curvenNZDS);

    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.NZDS.address,
      toToken: TOKENS.USDC.address,
      amount: parseUnits("14500000", TOKENS.NZDS.decimals),
      fromOracle: ORACLES.NZDS.address,
      toOracle: ORACLES.USDC.address,
      fromDecimals: TOKENS.NZDS.decimals,
      toDecimals: TOKENS.USDC.decimals,
    });
    await poolStats(usdc, nzds, curvenNZDS);

    await routerOriginSwapAndCheck({
      user: user2,
      fromToken: TOKENS.USDC.address,
      toToken: TOKENS.NZDS.address,
      amount: parseUnits("954500000", TOKENS.USDC.decimals),
      fromOracle: ORACLES.USDC.address,
      toOracle: ORACLES.NZDS.address,
      fromDecimals: TOKENS.USDC.decimals,
      toDecimals: TOKENS.NZDS.decimals,
    });
    await poolStats(usdc, nzds, curvenNZDS);

    await tokenStats(user1);
    await curvenNZDS
      .connect(user1)
      .withdraw(parseUnits("2000000000"), await getFutureTime())
      .then(x => x.wait());
    await poolStats(usdc, nzds, curvenNZDS);
    await tokenStats(user1);
  });
});
