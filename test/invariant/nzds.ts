/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import chai from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../../typechain/CurveFactory";
import { Curve } from "../../typechain/Curve";
import { ERC20 } from "../../typechain/ERC20";
import { Router } from "../../typechain/Router";

import { ORACLES, TOKENS } from ".././Constants";
import { getFutureTime, expectBNAproxEq, getOracleAnswer } from ".././Utils";

import { scaffoldTest, scaffoldHelpers } from ".././Setup";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("NZDS-USDC", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let nzdsToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

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
    const { curve: curvenNZDS } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: nzds.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.6899691997"),
      quoteWeight: parseUnits("0.3120308003"),
      baseAssimilator: nzdsToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });
    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("300000000", TOKENS.USDC.decimals), curvenNZDS.address],
      [TOKENS.NZDS.address, user1, parseUnits("300000000", TOKENS.NZDS.decimals), curvenNZDS.address],
    ]);

    console.log("-----------------  user 1 nzds balance is ", await getNZDSBalance(user1));
    console.log("-----------------  user 1 nzds balance is ", await getUSDCBalance(user1));

    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user2, parseUnits("300000000", TOKENS.USDC.decimals), curvenNZDS.address],
      [TOKENS.NZDS.address, user2, parseUnits("300000000", TOKENS.NZDS.decimals), curvenNZDS.address],
    ]);

    console.log("-----------------  user 2 nzds balance is ", await getNZDSBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));

    await curvenNZDS
      .connect(user1)
      .deposit(parseUnits("9810943.59"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 nzds balance is ", await getNZDSBalance(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, nzds, curvenNZDS);
    // now trying swap
    await curvenNZDS.originSwap(
      TOKENS.USDC.address,
      TOKENS.NZDS.address,
      parseUnits("1000000", TOKENS.USDC.decimals),
      0,
      await getFutureTime(),
    );
    console.log("----------------- after 1m usdc swap, pool stats\n");
    console.log("-----------------  user 1 nzds balance is ", await getNZDSBalance(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, nzds, curvenNZDS);
    // now trying to add another huge amount
    console.log("----------------- adding 19m liqudity to the pool\n");
    await curvenNZDS
      .connect(user1)
      .deposit(parseUnits("19810943.59"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 nzds balance is ", await getNZDSBalance(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, nzds, curvenNZDS);

    console.log("----------------- user2 now deposits 20m\n");
    await curvenNZDS
      .connect(user2)
      .deposit(parseUnits("20000000"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 2 nzds balance is ", await getNZDSBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, nzds, curvenNZDS);

    console.log("----------------- user2 swaps 5m nzds\n");
    // user 2 swaps 5m nzds
    await curvenNZDS
      .connect(user2)
      .originSwap(
        TOKENS.NZDS.address,
        TOKENS.USDC.address,
        parseUnits("5000000", TOKENS.NZDS.decimals),
        0,
        await getFutureTime(),
      );
    console.log("-----------------  user 2 nzds balance is ", await getNZDSBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, nzds, curvenNZDS);

    console.log("----------------- user2 swaps 1m usdc\n");
    // user 2 swaps 5m nzds
    await curvenNZDS
      .connect(user2)
      .originSwap(
        TOKENS.USDC.address,
        TOKENS.NZDS.address,
        parseUnits("1000000", TOKENS.NZDS.decimals),
        0,
        await getFutureTime(),
      );
    console.log("-----------------  user 2 nzds balance is ", await getNZDSBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, nzds, curvenNZDS);

    console.log("----------------- user2 withdraws 10m liquidity\n");
    // user2 now withdraws 10m liquidity
    await curvenNZDS.connect(user2).withdraw(parseUnits("10000000"), await getFutureTime());
    console.log("-----------------  user 2 nzds balance is ", await getNZDSBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, nzds, curvenNZDS);
  });

  const getNZDSBalance = async (user: Signer) => {
    let _user_n_bal = await nzds.balanceOf(await user.getAddress());
    let user_n_bal = formatUnits(_user_n_bal, TOKENS.NZDS.decimals);
    return user_n_bal;
  };

  const getUSDCBalance = async (user: Signer) => {
    let _user_n_bal = await usdc.balanceOf(await user.getAddress());
    let user_n_bal = formatUnits(_user_n_bal, TOKENS.USDC.decimals);
    return user_n_bal;
  };

  const poolStats = async (usdc: Contract, forexTokenContract: Contract, pool: Contract) => {
    const viewCurve = await pool.viewCurve();
    console.log(`curve state\n`);
    console.log(viewCurve, "\n");
    const rawTotalSupply = await pool.totalSupply();
    const totalSupply = formatUnits(rawTotalSupply);

    const rawLiq = await pool.liquidity();
    const totalValueUsd = formatUnits(rawLiq[0], 18);
    const nzdsValueUsd = formatUnits(rawLiq[1][0], 18);
    const usdcValueUsd = formatUnits(rawLiq[1][1], 18);
    const nzdsRatio = Number(nzdsValueUsd) / Number(totalValueUsd);
    console.log(`total value in usd is ${totalValueUsd}\n`);
    console.log(`nzds usd value: ${nzdsValueUsd}\n`);
    console.log(`usdc value : ${usdcValueUsd}\n`);
    console.log("\nTotal LPT:", totalSupply, "\n");
    console.log("Pool NZDS ratio:", nzdsRatio, "\n");
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

  it("NZDS -> USDC targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.NZDS.address,
      toToken: TOKENS.USDC.address,
      targetAmount: parseUnits("900", TOKENS.USDC.decimals),
      fromOracle: ORACLES.NZDS.address,
      toOracle: ORACLES.USDC.address,
      fromDecimals: TOKENS.NZDS.decimals,
      toDecimals: TOKENS.USDC.decimals,
    });
  });
});
