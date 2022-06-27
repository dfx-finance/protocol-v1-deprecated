/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import chai from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../../typechain/CurveFactory";
import { Curve } from "../../typechain/Curve";
import { ERC20 } from "../../typechain/ERC20";
import { Router } from "../../typechain/Router";

import { ORACLES, TOKENS } from "../Constants";
import { getFutureTime, expectBNAproxEq, getOracleAnswer } from "../Utils";

import { scaffoldTest, scaffoldHelpers } from "../Setup";
import { parse } from "path";

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

    ({ multiMintAndApprove } = await scaffoldHelpers({
      curveFactory,
      erc20,
    }));
  });
  beforeEach(async function () {
    let trybCurveAddress: string = "0xc574a613a3900e4314da13eb2287f13689a5b64d";
    let curvenTRYB = (await ethers.getContractAt("Curve", trybCurveAddress)) as Curve;

    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("30000000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user1, parseUnits("30000000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);

    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user2, parseUnits("30000000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user2, parseUnits("30000000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);

    await poolStats(usdc, tryb, curvenTRYB);
    console.log(`before deposit, lp supply is ${await getTotalSupply(curvenTRYB)}`);
    console.log("deposit 5000000");
    await deposit("5000000", user1, curvenTRYB);
    await poolStats(usdc, tryb, curvenTRYB);
    console.log(`user1 lp balance is ${await getLPBalance(user1, curvenTRYB)}`);
    console.log(`after deposit, lp supply is ${await getTotalSupply(curvenTRYB)}`);
    console.log("user withdraws all deposited amount");
    await curvenTRYB
      .connect(user1)
      .withdraw(parseUnits(await getLPBalance(user1, curvenTRYB), 18), await getFutureTime());
    await poolStats(usdc, tryb, curvenTRYB);
    console.log(`after withdrawl, lp supply is ${await getTotalSupply(curvenTRYB)}`);
    console.log(`user 1 usdc balance is ${await getUSDCBalance(user1)}`);
    console.log(`user1 tryb balance is ${await getTRYBBalace(user1)}`);
    console.log(`pool usdc balance is ${await getUSDCBalanceOfPool(curvenTRYB.address)}`);
    console.log(`pool tryb balance is ${await getTRYBBalaceOfPool(curvenTRYB.address)}`);
    //     console.log("tryb token balances");
    //     console.log(`user 1 usdc balance is ${await getUSDCBalance(user1)}`);
    //     console.log(`user1 tryb balance is ${await getTRYBBalace(user1)}`);
    //     console.log(`pool usdc balance is ${await getUSDCBalanceOfPool(curvenTRYB.address)}`);
    //     console.log(`pool tryb balance is ${await getTRYBBalaceOfPool(curvenTRYB.address)}`);

    //     console.log("original mainnet forked curve state");

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     console.log(`user 1 usdc balance is ${await getUSDCBalance(user1)}`);
    //     console.log(`user1 tryb balance is ${await getTRYBBalace(user1)}`);
    //     console.log(`pool usdc balance is ${await getUSDCBalanceOfPool(curvenTRYB.address)}`);
    //     console.log(`pool tryb balance is ${await getTRYBBalaceOfPool(curvenTRYB.address)}`);

    //     // now trying 0.1m usdc swap
    //     await curvenTRYB.originSwap(TOKENS.TRYB.address, TOKENS.USDC.address,parseUnits("2000000", TOKENS.TRYB.decimals),parseUnits("80000", TOKENS.USDC.decimals),await getFutureTime());
    //     console.log("----------------- after 0.1m usdc swap, pool stats\n");
    //     await poolStats(usdc, tryb, curvenTRYB);
    //     console.log(`user 1 usdc balance is ${await getUSDCBalance(user1)}`);
    //     console.log(`user1 tryb balance is ${await getTRYBBalace(user1)}`);
    //     console.log(`pool usdc balance is ${await getUSDCBalanceOfPool(curvenTRYB.address)}`);
    //     console.log(`pool tryb balance is ${await getTRYBBalaceOfPool(curvenTRYB.address)}`);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("20000", user1,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("1000000", user1,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("5000000", user1,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("5000000", user2,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("20000000", user1,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);

    //     await poolStats(usdc, tryb, curvenTRYB);
    //     await deposit("100000000", user1,curvenTRYB);
    //     await poolStats(usdc, tryb, curvenTRYB);
  });

  async function deposit(amount: string, user: Signer, curvenTRYB: Curve) {
    console.log(`user deposits ${amount}`);
    let userUSDCBalanceBefore = await getUSDCBalance(user);
    let userTRYBBalanceBefore = await getTRYBBalace(user);
    let poolUSDCBanaceBefore = await getUSDCBalanceOfPool(curvenTRYB.address);
    let poolTRYBBalanceBefore = await getTRYBBalaceOfPool(curvenTRYB.address);
    console.log(`before deposit, user's usdc balance : ${userUSDCBalanceBefore}`);
    console.log(`before deposit, user's try balance : ${userTRYBBalanceBefore}`);
    console.log(`before deposit, pool usdc balance is ${poolUSDCBanaceBefore}`);
    console.log(`before deposit, pool tryb balance is ${poolTRYBBalanceBefore}`);
    await curvenTRYB
      .connect(user)
      .deposit(parseUnits(amount), await getFutureTime())
      .then(x => x.wait());
    let userUSDCBalanceAfter = await getUSDCBalance(user);
    let userTRYBBalanceAfter = await getTRYBBalace(user);
    let poolUSDCBanaceAfter = await getUSDCBalanceOfPool(curvenTRYB.address);
    let poolTRYBBalanceAfter = await getTRYBBalaceOfPool(curvenTRYB.address);
    console.log(`after deposit, user's usdc balance : ${userUSDCBalanceAfter}`);
    console.log(`after deposit, user's try balance : ${userTRYBBalanceAfter}`);
    console.log(`after deposit, pool usdc balance is ${poolUSDCBanaceAfter}`);
    console.log(`after deposit, pool tryb balance is ${poolTRYBBalanceAfter}`);
    console.log(`user usdc balance diff is ${parseInt(userUSDCBalanceBefore) - parseInt(userUSDCBalanceAfter)}`);
    console.log(`user tryb balance diff is ${parseInt(userTRYBBalanceBefore) - parseInt(userTRYBBalanceAfter)}`);
  }

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

  const getUSDCBalanceOfPool = async (address: string) => {
    let _user_n_bal = await usdc.balanceOf(address);
    let user_n_bal = formatUnits(_user_n_bal, TOKENS.USDC.decimals);
    return user_n_bal;
  };

  const getTRYBBalaceOfPool = async (address: string) => {
    let _user_n_bal = await tryb.balanceOf(address);
    let user_n_bal = formatUnits(_user_n_bal, TOKENS.TRYB.decimals);
    return user_n_bal;
  };

  const getLPBalance = async (user: Signer, curvenTRYB: Curve) => {
    let _user_bal = await curvenTRYB.balanceOf(await user.getAddress());
    let user_bal = formatUnits(_user_bal, 18);
    return user_bal;
  };

  const getTotalSupply = async (curvenTRYB: Curve) => {
    let _ts = await curvenTRYB.totalSupply();
    let ts = formatUnits(_ts, 18);
    return ts;
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
