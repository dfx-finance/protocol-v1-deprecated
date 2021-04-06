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

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("Factory", function () {
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

    ({ createCurveAndSetParams } = await scaffoldHelpers({
      curveFactory,
      erc20,
    }));
  });

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
      ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["uint256", "uint256"], [cadc.address, usdc.address])),
    );

    expect(curve.address.toLowerCase()).to.be.eq(curveCadcUsdcAddress.toLowerCase());
  });
});
