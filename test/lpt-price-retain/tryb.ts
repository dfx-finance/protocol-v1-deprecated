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

import { scaffoldTest, scaffoldHelpers } from "../SetupManual";

import hre from "hardhat";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

const holder = "0x062ea073afbcd4109567544ac0ff97c0d572705e";



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

    ({ createCurveAndSetParams, multiMintAndApprove } = await scaffoldHelpers({
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
      baseWeight: parseUnits("0.6899691997"),
      quoteWeight: parseUnits("0.3120308003"),
      baseAssimilator: trybToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });

    const poolBalances =async () => {
      let _usdcBal = await usdc.balanceOf(curvenTRYB.address);
      let usdcBal = formatUnits(_usdcBal,6);
      let _trybBal = await tryb.balanceOf(curvenTRYB.address);
      let trybBal = formatUnits(_trybBal,6);

      console.log(`pool usdc : ${usdcBal},   tryb : ${trybBal}`);

    }

    // func to read lpt balance
    const getLPTBalance = async (user : Signer) => {
      let _user_n_bal = await curvenTRYB.balanceOf(await user.getAddress());
      let user_n_bal = formatUnits(_user_n_bal, await curvenTRYB.decimals());
      return user_n_bal;
    }

    const getLPTTotalSupply =async () => {
      let _ts = await curvenTRYB.totalSupply();
      let ts = formatUnits(_ts, await curvenTRYB.decimals());
      console.log(`lp token total supply is ${ts}`);
    }

    const  setupBalance = async(hodler : string, user : Signer) => {
      console.log(`addr ${curvenTRYB.address}`);
      await hre.network.provider.request({
        method : "hardhat_impersonateAccount",
        params : [
          hodler
        ]
      });
      user1.sendTransaction({value : ethers.utils.parseEther("10"), to : hodler});
      const hodlerSigner = ethers.provider.getSigner(hodler);
      await curvenTRYB.connect(hodlerSigner).transfer(await user.getAddress(), await curvenTRYB.balanceOf(await hodlerSigner.getAddress()) );
    }
    await setupBalance(holder, user1);
    console.log(`lpt token amount of user1 is ${await getLPTBalance(user1)}`);
    

    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("300000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user1, parseUnits("300000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);
    // Supply liquidity to the pools
    // Mint tokens and approve
    await multiMintAndApprove([
      [TOKENS.USDC.address, user2, parseUnits("300000000", TOKENS.USDC.decimals), curvenTRYB.address],
      [TOKENS.TRYB.address, user2, parseUnits("300000000", TOKENS.TRYB.decimals), curvenTRYB.address],
    ]);

    console.log("original pool balance & lpt total supply");
    await poolBalances();
    await getLPTTotalSupply();

    console.log("let user 2 deposit 39k usdc");
    await curvenTRYB
    .connect(user2)
    .deposit(parseUnits("78000"), await getFutureTime())
    .then(x => x.wait());
    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    console.log("-----------------  user 2 lpt balance is ", await getLPTBalance(user2));
    await poolBalances();
    await getLPTTotalSupply();
    await curvenTRYB.connect(user2).withdraw(await curvenTRYB.balanceOf(await user2.getAddress()), await getFutureTime());

    console.log("-----------------  user 2 tryb balance is ", await getTRYBBalance(user2));
    console.log("-----------------  user 2 usdc balance is ", await getUSDCBalance(user2));
    console.log("-----------------  user 2 lpt balance is ", await getLPTBalance(user2));

    await poolBalances();
    await getLPTTotalSupply();
  });

  const getTRYBBalance = async (user: Signer) => {
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

    expectBNAproxEq(sent, expected, parseUnits("2", fromDecimals));
  };

  it("TRYB -> USDC", async function () {
  });
});