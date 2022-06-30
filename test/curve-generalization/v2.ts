/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import { formatUnits } from "ethers/lib/utils";
import chai, { expect } from "chai";
import chaiBigNumber from "chai-bignumber";

import { CurveFactory } from "../../typechain/CurveFactory";
import  {CurveFactoryV2 } from "../../typechain/CurveFactoryV2";
import { AssimilatorFactory } from "../../typechain/AssimilatorFactory";
import { Curve } from "../../typechain/Curve";
import { ERC20 } from "../../typechain/ERC20";
import { Router } from "../../typechain/Router";

import { ORACLES, TOKENS } from "../Constants";
import { getFutureTime, expectBNAproxEq, getOracleAnswer } from "../Utils";

import { scaffoldTest, scaffoldHelpers } from "../Setup";
import { isBigNumberish } from "@ethersproject/bignumber/lib/bignumber";
import { solidity } from "ethereum-waffle";
chai.use(solidity);

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.6");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("1"); //0.3

describe("CADC-USDC", function () {
  let [user1, user2, treasury]: Signer[] = [];
  let [user1Address, user2Address, treasuryAddress]: string[] = [];

  let usdcToUsdAssimilator: Contract;
  let cadcToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;
  let CurveFactoryV2 : ContractFactory;
  let AssimilatorFactory : ContractFactory;

  let curveFactory: CurveFactory;
  let curveFactoryV2 : CurveFactoryV2;
  let assimFactory : AssimilatorFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
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
    factoryAddress
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
    factoryAddress: string;
  }) => Promise<{
    curve: Curve;
    curveLpToken: ERC20;
  }>;

  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  before(async () => {
    ({
      users: [user1, user2, treasury],
      userAddresses: [user1Address, user2Address, treasuryAddress],
      usdcToUsdAssimilator,
      cadcToUsdAssimilator,
      CurveFactory,
      CurveFactoryV2,
      AssimilatorFactory,
      RouterFactory,
      usdc,
      cadc,
      erc20,
    } = await scaffoldTest());
  });

  beforeEach(async () => {
    //   deploy assim & curve factory v2
    assimFactory = (await AssimilatorFactory.deploy()) as AssimilatorFactory;
    curveFactoryV2 = (await CurveFactoryV2.deploy(50, treasuryAddress, assimFactory.address)) as CurveFactoryV2;
    
    console.log("assim factory deployed at ", assimFactory.address);
    console.log("curve factory v2 deployed at ", curveFactoryV2.address);

    curveFactory = (await CurveFactory.deploy(50, treasuryAddress)) as CurveFactory;
    router = (await RouterFactory.deploy(curveFactory.address)) as Router;

    ({ createCurveAndSetParams, multiMintAndApprove } = await scaffoldHelpers({
      curveFactory,
      erc20,
    }));
  });

  const getUSDCBalance = async (address: string) => {
    let _user_n_bal = await usdc.balanceOf(address);
    return formatUnits(_user_n_bal, TOKENS.USDC.decimals);
  };

  const getCADCBalance = async (address: string) => {
    let _user_n_bal = await cadc.balanceOf(address);
    return formatUnits(_user_n_bal, TOKENS.CADC.decimals);
  };

  it.skip("cadc-usdc swap", async () => {
    const { curve: cadcCurve } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: cadc.address,
      quote: usdc.address,
      baseWeight: parseUnits("0.6"),
      quoteWeight: parseUnits("0.4"),
      baseAssimilator: cadcToUsdAssimilator.address,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      factoryAddress: curveFactory.address
    });

    await multiMintAndApprove([
      [TOKENS.USDC.address, user1, parseUnits("300000000", TOKENS.USDC.decimals), cadcCurve.address],
      [TOKENS.CADC.address, user1, parseUnits("300000000", TOKENS.CADC.decimals), cadcCurve.address],
    ]);

    // mint 300k cadc to user2
    await multiMintAndApprove([
      [TOKENS.CADC.address, user2, parseUnits("3000", TOKENS.CADC.decimals), cadcCurve.address],
    ]);

    // deposit 600k worth of cadc & 400k worth of usdc to the curve
    await cadcCurve.connect(user1).deposit(parseUnits("1000000"), await getFutureTime());
    let originalCADCBalance = await getCADCBalance(await user2.getAddress());
    let originalUSDCBalance = await getUSDCBalance(await user2.getAddress());

    console.log("-----Start: After deposit-----");
    console.log("CADC Bal", (await cadc.balanceOf(cadcCurve.address)).toString());
    console.log("USDC Bal", (await usdc.balanceOf(cadcCurve.address)).toString());
    console.log("-----End: After deposit-----");

    // swap 300k cadc into usdc
    await cadcCurve
      .connect(user2)
      .originSwap(
        TOKENS.CADC.address,
        TOKENS.USDC.address,
        parseUnits("3000", TOKENS.CADC.decimals),
        0,
        await getFutureTime(),
      );

    console.log("-----Start: 1st Swap-----");
    console.log("CADC Bal", (await cadc.balanceOf(cadcCurve.address)).toString());
    console.log("USDC Bal", (await usdc.balanceOf(cadcCurve.address)).toString());
    console.log("-----End: 1st Swap-----");

    let afterSwapCADCBalance = await getCADCBalance(await user2.getAddress());
    let afterSwapUSDCBalance = await getUSDCBalance(await user2.getAddress());

    await usdc.connect(user2).approve(cadcCurve.address, parseUnits(afterSwapUSDCBalance, TOKENS.USDC.decimals));

    // swap back usdc to cadc
    console.log(
      "viewOriginSwap: ",
      (
        await cadcCurve
          .connect(user2)
          .viewOriginSwap(
            TOKENS.USDC.address,
            TOKENS.CADC.address,
            parseUnits(afterSwapUSDCBalance, TOKENS.USDC.decimals),
          )
      ).toString(),
    );
    await cadcCurve
      .connect(user2)
      .originSwap(
        TOKENS.USDC.address,
        TOKENS.CADC.address,
        parseUnits(afterSwapUSDCBalance, TOKENS.USDC.decimals),
        0,
        await getFutureTime(),
      );

    let afterReverseSwapCADCBalance = await getCADCBalance(await user2.getAddress());
    let afterReverseSwapUSDCBalance = await getUSDCBalance(await user2.getAddress());

    console.log(originalCADCBalance, "     ", originalUSDCBalance);
    console.log(afterSwapCADCBalance, "     ", afterSwapUSDCBalance);
    console.log(afterReverseSwapCADCBalance, "     ", afterReverseSwapUSDCBalance);
  });

  const getPoolStats = async (cadcCurve: Contract) => {
    let stats = await cadcCurve.viewCurve();
    console.log(stats);
  };

  it("AssimilatorFactory", async () => {
    const tx = await assimFactory.newAssimilator(cadc.address, usdc.address, 18);
    const assim = await tx.wait();
    console.log(assim);

    console.log(await assimFactory.getAssimilator(usdc.address));
    await expect(assimFactory.newAssimilator(cadc.address, usdc.address, 18)).to.be.revertedWith("AssimilatorFactory/currency-pair-already-exists");
    await assimFactory.revokeAssimilator(usdc.address);
    await assimFactory.newAssimilator(cadc.address, usdc.address, 18);
    console.log(await assimFactory.getAssimilator(usdc.address));
  });
});
