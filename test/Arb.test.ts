/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import chai, { expect } from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../typechain/CurveFactory";
import { Curve } from "../typechain/Curve";
import { ERC20 } from "../typechain/ERC20";
import { Router } from "../typechain/Router";

import { scaffoldTest, scaffoldHelpers } from "./Setup";
import { ORACLES, TOKENS } from "./Constants";
import { formatUnits } from "ethers/lib/utils";
import { getOracleAnswer } from "./Utils";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX V1";
const ALPHA = parseUnits("0.8");
const BETA = parseUnits("0.5");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0005");
const LAMBDA = parseUnits("0.3");

describe("Arb", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let erc20: ERC20;

  let mintAndApprove: (tokenAddress: string, minter: Signer, amount: BigNumberish, recipient: string) => Promise<void>;
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

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

  before(async function () {
    ({
      users: [user1, user2],
      userAddresses: [user1Address, user2Address],
      cadcToUsdAssimilator,
      usdcToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
      cadc,
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

  it("Arb - 20/75", async function () {
    const base = cadc.address;
    const quote = usdc.address;
    const baseDecimals = TOKENS.CADC.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;

    const { curve } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: cadc.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.5"),
      quoteWeight: parseUnits("0.5"),
      baseAssimilator: cadcToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
    });

    await multiMintAndApprove([
      [base, user1, parseUnits("100000", baseDecimals), curve.address],
      [quote, user1, parseUnits("100000", quoteDecimals), curve.address],
    ]);

    await curve.deposit(parseUnits("100000"), ethers.constants.MaxUint256);

    // Give pool an excessive amount of CADC
    const expectedRate = await getOracleAnswer(ORACLES.CADC.address);

    console.log("expected rate", formatUnits(expectedRate, ORACLES.CADC.decimals));
    await curve.originSwap(base, quote, parseUnits("35000", baseDecimals), 0, ethers.constants.MaxUint256);

    const beforeQuote = await cadc.balanceOf(user1Address);
    // Get premium involved with supplying pool
    await curve.originSwap(quote, base, parseUnits("1000", quoteDecimals), 0, ethers.constants.MaxUint256);
    const afterQuote = await cadc.balanceOf(user1Address);

    console.log(formatUnits(afterQuote.sub(beforeQuote), baseDecimals));
  });
});
