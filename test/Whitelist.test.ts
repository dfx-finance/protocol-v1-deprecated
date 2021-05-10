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
  getFutureTime,
  updateOracleAnswer,
  expectBNAproxEq,
  expectBNEq,
  getOracleAnswer,
  unlockAccountAndGetSigner,
} from "./Utils";

import { scaffoldTest, scaffoldHelpers } from "./Setup";
import merkleData from "../merkle-data/whitelist-merkle-proof.json";

chai.use(chaiBigNumber(BigNumber));

const { parseUnits } = ethers.utils;

const NAME = "DFX V1";
const SYMBOL = "DFX-V1";
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

describe("Whitelist", function () {
  let [owner, user1, user2]: Signer[] = [];
  let [ownerAddress, user1Address, user2Address]: string[] = [];

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let eursToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;
  let RouterFactory: ContractFactory;

  let curveFactory: CurveFactory;
  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
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
    yesWhitelisting,
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
    yesWhitelisting?: boolean;
  }) => Promise<{
    curve: Curve;
    curveLpToken: ERC20;
  }>;

  let mintAndApprove: (tokenAddress: string, minter: Signer, amount: BigNumberish, recipient: string) => Promise<void>;
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  let rates: BigNumber[];
  const oracles = [ORACLES.CADC.address, ORACLES.XSGD.address, ORACLES.EURS.address];

  beforeEach(async () => {
    rates = await Promise.all(oracles.map(x => getOracleAnswer(x)));
  });

  afterEach(async () => {
    await Promise.all(rates.map((x, i) => updateOracleAnswer(oracles[i], x)));
  });

  before(async function () {
    ({
      users: [owner, user1, user2],
      userAddresses: [ownerAddress, user1Address, user2Address],
      cadcToUsdAssimilator,
      usdcToUsdAssimilator,
      eursToUsdAssimilator,
      xsgdToUsdAssimilator,
      CurveFactory,
      RouterFactory,
      usdc,
      cadc,
      eurs,
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

  it("Only whitelisted users can deposit a max of $10_000 (USD) worth of tokens ", async function () {
    const base = TOKENS.CADC.address;
    const baseAssimilator = cadcToUsdAssimilator.address;
    const baseDecimals = 18;

    const whitelistedUserAddress = "0x000f4432a40560bBFf1b581a8b7AdEd8dab80026";
    const { index, amount, proof } = merkleData.claims[whitelistedUserAddress];
    const whitelistedUser = await unlockAccountAndGetSigner(whitelistedUserAddress);

    const { curve } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: base,
      quote: TOKENS.USDC.address,
      baseWeight: parseUnits("0.5"),
      quoteWeight: parseUnits("0.5"),
      baseAssimilator: baseAssimilator,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      yesWhitelisting: true,
    });

    await multiMintAndApprove([
      [base, user1, parseUnits("10000000", baseDecimals), curve.address],
      [TOKENS.USDC.address, user1, parseUnits("10000000", 6), curve.address],
      [base, whitelistedUser, parseUnits("10000000", baseDecimals), curve.address],
      [TOKENS.USDC.address, whitelistedUser, parseUnits("10000000", 6), curve.address],
    ]);

    try {
      await curve.connect(user1).deposit(parseUnits("100"), await getFutureTime());
      throw new Error("Non whitelisted user shouldn't be able to deposit");
    } catch (e) {
      // eslint-disable-next-line
    }

    try {
      await curve
        .connect(user1)
        .depositWithWhitelist(index, whitelistedUserAddress, amount, proof, parseUnits("100"), await getFutureTime());
      throw new Error("Non whitelisted user shouldn't be able to deposit for someone else");
    } catch (e) {
      // eslint-disable-next-line
    }

    // Whitelisted
    await curve
      .connect(whitelistedUser)
      .depositWithWhitelist(index, whitelistedUserAddress, amount, proof, parseUnits("10000"), await getFutureTime());
    await curve.connect(whitelistedUser).withdraw(parseUnits("10000"), await getFutureTime());

    try {
      await curve
        .connect(whitelistedUser)
        .depositWithWhitelist(index, whitelistedUserAddress, amount, proof, parseUnits("10001"), await getFutureTime());
      throw new Error("Only whitelisted users can deposit a max of 10k");
    } catch (e) {
      // eslint-disable-next-line
    }
  });

  it("depositWithWhitelist disabled after whitelisting period ended ", async function () {
    const base = TOKENS.CADC.address;
    const baseAssimilator = cadcToUsdAssimilator.address;
    const baseDecimals = 18;

    const whitelistedUserAddress = "0x000f4432a40560bBFf1b581a8b7AdEd8dab80026";
    const { index, amount, proof } = merkleData.claims[whitelistedUserAddress];
    const whitelistedUser = await unlockAccountAndGetSigner(whitelistedUserAddress);

    const { curve } = await createCurveAndSetParams({
      name: NAME,
      symbol: SYMBOL,
      base: base,
      quote: TOKENS.USDC.address,
      baseWeight: parseUnits("0.5"),
      quoteWeight: parseUnits("0.5"),
      baseAssimilator: baseAssimilator,
      quoteAssimilator: usdcToUsdAssimilator.address,
      params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
      yesWhitelisting: true,
    });

    await multiMintAndApprove([
      [base, user1, parseUnits("10000000", baseDecimals), curve.address],
      [TOKENS.USDC.address, user1, parseUnits("10000000", 6), curve.address],
      [base, whitelistedUser, parseUnits("10000000", baseDecimals), curve.address],
      [TOKENS.USDC.address, whitelistedUser, parseUnits("10000000", 6), curve.address],
    ]);

    // Whitelisted
    try {
      await curve
        .connect(whitelistedUser)
        .depositWithWhitelist(index, whitelistedUserAddress, amount, proof, parseUnits("10000"), await getFutureTime());
      throw new Error("Shouldn't be able to deposit via depositWithWhitelist");
    } catch (e) {
      // eslint-disable-next-line
    }
  });
});
