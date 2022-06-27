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

import { ORACLES, TOKENS } from "../Constants";
import { getFutureTime, expectBNAproxEq, getOracleAnswer } from "../Utils";

import { scaffoldTest, scaffoldHelpers } from "../Setup";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("TRYB-USDC", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let usdcToUsdAssimilator: Contract;
  let trybToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
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
      usdcToUsdAssimilator,
      trybToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
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
    const { curve: curvenTRYB } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: tryb.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.77"),
      quoteWeight: parseUnits("0.23"),
      baseAssimilator: trybToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });
    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("300000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user1, parseUnits("300000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);

    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));

    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user2, parseUnits("300000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user2, parseUnits("300000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);

    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalace(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));

    console.log("----------------- try adding 20000 liquidity");
    await curvenTRYB
      .connect(user1)
      .deposit(parseUnits("20000"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, tryb, curvenTRYB);
    console.log("adding new liquidity to adjust to mainnet balance");
    await curvenTRYB
      .connect(user1)
      .deposit(parseUnits((1377808.94 - 20000).toString()), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, tryb, curvenTRYB);

    console.log("adding 10m liquidity");
    await curvenTRYB
      .connect(user1)
      .deposit(parseUnits("10000000"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, tryb, curvenTRYB);

    // now trying swap
    await curvenTRYB.originSwap(
      TOKENS.USDC.address,
      TOKENS.TRYB.address,
      parseUnits("1000000", TOKENS.USDC.decimals),
      0,
      await getFutureTime(),
    );
    console.log("----------------- after 1m usdc swap, pool stats\n");
    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, tryb, curvenTRYB);
    // now trying to add another huge amount
    console.log("----------------- adding 19m liqudity to the pool\n");
    await curvenTRYB
      .connect(user1)
      .deposit(parseUnits("19810943.59"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 1 tryb balance is ", await getTRYBBalace(user1));
    console.log("-----------------  user 1 usdc balance is ", await getUSDCBalance(user1));
    await poolStats(usdc, tryb, curvenTRYB);

    console.log("----------------- user2 now deposits 20m\n");
    await curvenTRYB
      .connect(user2)
      .deposit(parseUnits("20000000"), await getFutureTime())
      .then(x => x.wait());
    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalace(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, tryb, curvenTRYB);

    console.log("----------------- user2 swaps 5m tryb\n");
    // user 2 swaps 5m tryb
    await curvenTRYB
      .connect(user2)
      .originSwap(
        TOKENS.TRYB.address,
        TOKENS.USDC.address,
        parseUnits("5000000", TOKENS.TRYB.decimals),
        0,
        await getFutureTime(),
      );
    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalace(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, tryb, curvenTRYB);

    console.log("----------------- user2 swaps 1m usdc\n");
    // user 2 swaps 5m tryb
    await curvenTRYB
      .connect(user2)
      .originSwap(
        TOKENS.USDC.address,
        TOKENS.TRYB.address,
        parseUnits("1000000", TOKENS.TRYB.decimals),
        0,
        await getFutureTime(),
      );
    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalace(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, tryb, curvenTRYB);

    console.log("----------------- user2 withdraws 10m liquidity\n");
    // user2 now withdraws 10m liquidity
    await curvenTRYB.connect(user2).withdraw(parseUnits("10000000"), await getFutureTime());
    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalace(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    await poolStats(usdc, tryb, curvenTRYB);
  });

  const getTRYBBalace = async (user: Signer) => {
    let _user_n_bal = await tryb.balanceOf(await user.getAddress());
    let user_n_bal = formatUnits(_user_n_bal, TOKENS.TRYB.decimals);
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
    const trybValueUsd = formatUnits(rawLiq[1][0], 18);
    const usdcValueUsd = formatUnits(rawLiq[1][1], 18);
    const trybRatio = Number(trybValueUsd) / Number(totalValueUsd);
    console.log(`total value in usd is ${totalValueUsd}\n`);
    console.log(`tryb usd value: ${trybValueUsd}\n`);
    console.log(`usdc value : ${usdcValueUsd}\n`);
    console.log("\nTotal LPT:", totalSupply, "\n");
    console.log("Pool TRYB ratio:", trybRatio, "\n");
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

    console.log(`sent amount is ${sent}`);
    console.log(`expected amount is ${expected}`);
    console.log(`from decimal value is ${fromDecimals}`);
    expectBNAproxEq(sent, expected, parseUnits("3", fromDecimals));
  };

  it("TRYB -> USDC targetSwap", async function () {
    await routerViewTargetSwapAndCheck({
      user: user2,
      fromToken: TOKENS.TRYB.address,
      toToken: TOKENS.USDC.address,
      targetAmount: parseUnits("900", TOKENS.USDC.decimals),
      fromOracle: ORACLES.TRYB.address,
      toOracle: ORACLES.USDC.address,
      fromDecimals: TOKENS.TRYB.decimals,
      toDecimals: TOKENS.USDC.decimals,
    });
  });
});
