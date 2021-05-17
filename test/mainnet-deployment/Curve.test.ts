/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, BigNumberish } from "ethers";
import chai, { expect } from "chai";
import chaiBigNumber from "chai-bignumber";

import { Curve, CurveFactory, ERC20, Router } from "../../typechain";

import { ORACLES, TOKENS } from "../Constants";
import {
  getFutureTime,
  updateOracleAnswer,
  expectBNAproxEq,
  expectBNEq,
  getOracleAnswer,
  snapshotAndRevert,
  unlockAccountAndGetSigner,
} from "../Utils";

import { formatUnits, namehash, parseUnits } from "ethers/lib/utils";
import { format } from "prettier";
import { scaffoldHelpers, scaffoldTest } from "../Setup";

chai.use(chaiBigNumber(BigNumber));

describe("Curve Mainnet Sanity Checks", function () {
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  let curveCADC: Curve;
  let curveEURS: Curve;
  let curveXSGD: Curve;

  let router: Router;

  let usdc: ERC20;
  let cadc: ERC20;
  let eurs: ERC20;
  let xsgd: ERC20;
  let erc20: ERC20;

  before(async function () {
    erc20 = (await ethers.getContractAt("ERC20", ethers.constants.AddressZero)) as ERC20;
    ({ multiMintAndApprove } = await scaffoldHelpers({
      curveFactory: null as CurveFactory,
      erc20,
    }));

    curveCADC = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0x52F1eE265befa61c83a654d242348b18Ad85C3d3",
    )) as Curve;
    curveEURS = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0xF3d8451c6A25368D1c8957EC8C6Aa76B86ba3a46",
    )) as Curve;
    curveXSGD = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0xEd9D7341C80F1c8A109696356d8fa35bd766489C",
    )) as Curve;
  });

  snapshotAndRevert();

  const sanityCheck = async (
    base: string,
    quote: string,
    baseDecimals: number,
    quoteDecimals: number,
    curve: Curve,
  ) => {
    const userAddress = "0x1407C9d09d1603A9A5b806A0C00f4D3734df15E0";
    const user = await unlockAccountAndGetSigner(userAddress);
    const userProof = {
      index: 28,
      amount: "0x01",
      proof: [
        "0x06c2671dbde443244feb8752d425a7650bed5af1383a0a121d54efd6a78a521f",
        "0x4ebddc87e24770dece2462ce30fffdc4da32c5563b0fdf3dd385307e2c694fe1",
        "0xca83c9a54c59c94b8b9bfbd9b58aa056a136058596b5e6bcb1989761920a2cad",
        "0x9676136c72ff4bf6148b9ce0cb49b7aab69ba1fe742b2f202ee7c664413de070",
        "0x291a036fdbf1876b96d9cc0138227ba144941ea8dcef8a2b817a0a21aedb01c7",
        "0xb63b8842ea1e9e4219e797fef7266f9466147413e0f5e90f80e6cd89def28b5d",
        "0x7d98a4db6824fa949e214d5eae8d2f26a02e9d510cc29a0dbf61843f4913cb98",
        "0x4c931488ffcbe48e2790c170e3d163d96bc94f9b02b84f5cd5a6558d75c8bf0f",
        "0x6fc939303414c593ab76806b3df8ad39854cf220c30a0c48747a81c3e9ffcf2a",
      ],
    };

    await multiMintAndApprove([
      [base, user, parseUnits("100000", baseDecimals), curve.address],
      [quote, user, parseUnits("100000", quoteDecimals), curve.address],
    ]);

    await curve
      .connect(user)
      .depositWithWhitelist(
        userProof.index,
        userAddress,
        userProof.amount,
        userProof.proof,
        parseUnits("9999"),
        await getFutureTime(),
        {
          gasPrice: 0,
        },
      );

    await curve
      .connect(user)
      .originSwap(base, quote, parseUnits("1", baseDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(quote, base, parseUnits("1", quoteDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(base, quote, parseUnits("100", baseDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(quote, base, parseUnits("100", quoteDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(base, quote, parseUnits("500", baseDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(quote, base, parseUnits("500", quoteDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(base, quote, parseUnits("1000", baseDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(quote, base, parseUnits("1000", quoteDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(base, quote, parseUnits("3000", baseDecimals), 0, await getFutureTime(), { gasPrice: 0 });
    await curve
      .connect(user)
      .originSwap(quote, base, parseUnits("3000", quoteDecimals), 0, await getFutureTime(), { gasPrice: 0 });

    await curve
      .connect(user)
      .withdraw(await curve.connect(user).balanceOf(userAddress), await getFutureTime(), { gasPrice: 0 });
  };

  it("CADC", async function () {
    const base = TOKENS.CADC.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.CADC.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveCADC;

    await sanityCheck(base, quote, baseDecimals, quoteDecimals, curve);
  });

  it("EURS", async function () {
    const base = TOKENS.EURS.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.EURS.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveEURS;

    await sanityCheck(base, quote, baseDecimals, quoteDecimals, curve);
  });

  it("XSGD", async function () {
    const base = TOKENS.XSGD.address;
    const quote = TOKENS.USDC.address;
    const baseDecimals = TOKENS.XSGD.decimals;
    const quoteDecimals = TOKENS.USDC.decimals;
    const curve = curveXSGD;

    await sanityCheck(base, quote, baseDecimals, quoteDecimals, curve);
  });
});
