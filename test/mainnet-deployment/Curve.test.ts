/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, BigNumber, BigNumberish } from "ethers";
import chai from "chai";
import chaiBigNumber from "chai-bignumber";

import { Curve, CurveFactory, ERC20 } from "../../typechain";

import { TOKENS } from "../Constants";
import { getFutureTime, snapshotAndRevert } from "../Utils";

import { parseUnits } from "ethers/lib/utils";
import { scaffoldHelpers } from "../Setup";

chai.use(chaiBigNumber(BigNumber));

describe("Curve Mainnet Sanity Checks", function () {
  let multiMintAndApprove: (requests: [string, Signer, BigNumberish, string][]) => Promise<void>;

  let curveCADC: Curve;
  let curveEURS: Curve;
  let curveXSGD: Curve;

  let erc20: ERC20;

  before(async function () {
    erc20 = (await ethers.getContractAt("ERC20", ethers.constants.AddressZero)) as ERC20;
    ({ multiMintAndApprove } = await scaffoldHelpers({
      curveFactory: null as CurveFactory,
      erc20,
    }));

    curveCADC = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0x288Ab1b113C666Abb097BB2bA51B8f3759D7729e",
    )) as Curve;
    curveEURS = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0xB72d390E07F40D37D42dfCc43E954Ae7c738Ad44",
    )) as Curve;
    curveXSGD = (await ethers.getContractAt(
      "./contracts/Curve.sol:Curve",
      "0x8e3e9cB46E593Ec0CaF4a1Dcd6DF3A79a87b1fd7",
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
    const [user] = await ethers.getSigners();
    const userAddress = await user.getAddress();

    await multiMintAndApprove([
      [base, user, parseUnits("100000", baseDecimals), curve.address],
      [quote, user, parseUnits("100000", quoteDecimals), curve.address],
    ]);

    await curve.connect(user).deposit(parseUnits("9999"), await getFutureTime(), {
      gasPrice: 0,
    });

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
