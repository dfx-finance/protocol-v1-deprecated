/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory } from "ethers";
import { ORACLES, TOKENS } from "./Constants";
import {
  mintCADC,
  mintUSDC,
  mintEURS,
  mintXSGD,
  getCurveAddressFromTxRecp,
  getFutureTime,
  updateOracleAnswer,
} from "./Utils";

const { parseUnits, formatUnits } = ethers.utils;

describe("Curve", function () {
  let [user1, user2]: Signer[] = [];
  let [user1Address, user2Address]: string[] = [];

  let CurvesLib: ContractFactory;
  let OrchestratorLib: ContractFactory;
  let ProportionalLiquidityLib: ContractFactory;
  let SwapsLib: ContractFactory;
  let ViewLiquidityLib: ContractFactory;

  let CadcToUsdAssimilator: ContractFactory;
  let UsdcToUsdAssimilator: ContractFactory;
  let EursToUsdAssimilator: ContractFactory;
  let XsgdToUsdAssimilator: ContractFactory;

  let curvesLib: Contract;
  let orchestratorLib: Contract;
  let proportionalLiquidityLib: Contract;
  let swapsLib: Contract;
  let viewLiquidityLib: Contract;

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;
  let eursToUsdAssimilator: Contract;
  let xsgdToUsdAssimilator: Contract;

  let CurveFactory: ContractFactory;

  let curveFactory: Contract;
  let usdc: Contract;
  let cadc: Contract;
  let eurs: Contract;
  let xsgd: Contract;

  const logTokenBalances = async (address: string) => {
    console.log("--------------------");
    console.log("usdc balance", formatUnits(await usdc.balanceOf(address), TOKENS.USDC.decimals));
    console.log("cadc balance", formatUnits(await cadc.balanceOf(address), TOKENS.CADC.decimals));
    console.log("eurs balance", formatUnits(await eurs.balanceOf(address), TOKENS.EURS.decimals));
    console.log("xsgd balance", formatUnits(await xsgd.balanceOf(address), TOKENS.XSGD.decimals));
    console.log("--------------------");
  };

  before(async function () {
    [user1, user2] = await ethers.getSigners();
    [user1Address, user2Address] = await Promise.all([user1, user2].map(x => x.getAddress()));

    CurvesLib = await ethers.getContractFactory("Curves");
    OrchestratorLib = await ethers.getContractFactory("Orchestrator");
    ProportionalLiquidityLib = await ethers.getContractFactory("ProportionalLiquidity");
    SwapsLib = await ethers.getContractFactory("Swaps");
    ViewLiquidityLib = await ethers.getContractFactory("ViewLiquidity");

    curvesLib = await CurvesLib.deploy();
    orchestratorLib = await OrchestratorLib.deploy();
    proportionalLiquidityLib = await ProportionalLiquidityLib.deploy();
    swapsLib = await SwapsLib.deploy();
    viewLiquidityLib = await ViewLiquidityLib.deploy();

    CadcToUsdAssimilator = await ethers.getContractFactory("CadcToUsdAssimilator");
    UsdcToUsdAssimilator = await ethers.getContractFactory("UsdcToUsdAssimilator");
    EursToUsdAssimilator = await ethers.getContractFactory("EursToUsdAssimilator");
    XsgdToUsdAssimilator = await ethers.getContractFactory("XsgdToUsdAssimilator");

    cadcToUsdAssimilator = await CadcToUsdAssimilator.deploy();
    usdcToUsdAssimilator = await UsdcToUsdAssimilator.deploy();
    eursToUsdAssimilator = await EursToUsdAssimilator.deploy();
    xsgdToUsdAssimilator = await XsgdToUsdAssimilator.deploy();

    CurveFactory = await ethers.getContractFactory("CurveFactory", {
      libraries: {
        Curves: curvesLib.address,
        Orchestrator: orchestratorLib.address,
        ProportionalLiquidity: proportionalLiquidityLib.address,
        Swaps: swapsLib.address,
        ViewLiquidity: viewLiquidityLib.address,
      },
    });
  });

  beforeEach(async function () {
    curveFactory = await CurveFactory.deploy();

    usdc = await ethers.getContractAt("ERC20", TOKENS.USDC.address);
    cadc = await ethers.getContractAt("ERC20", TOKENS.CADC.address);
    eurs = await ethers.getContractAt("ERC20", TOKENS.EURS.address);
    xsgd = await ethers.getContractAt("ERC20", TOKENS.XSGD.address);
  });

  it.only("curve logic", async function () {
    let tx = await curveFactory.newCurve(
      cadc.address,
      usdc.address,
      parseUnits("0.4"), // CADC 40% of pool
      parseUnits("0.6"), // USDC 60% of pool
      cadcToUsdAssimilator.address,
      usdcToUsdAssimilator.address,
    );
    const txRecp = await tx.wait();

    // Get curve address from logs
    const curveAddress = getCurveAddressFromTxRecp(txRecp);
    const curve = await ethers.getContractAt("Curve", curveAddress);

    // Set params
    tx = await curve.setParams(
      parseUnits("0.5"), // Alpha
      parseUnits("0.35"), // Beta
      parseUnits("0.15"), // Max
      parseUnits("0.0004"), // Epsilon
      parseUnits("0.3"), // Lambda
    );
    await tx.wait();

    // Mint tokens and approve
    await mintUSDC(user1Address, parseUnits("1000", TOKENS.USDC.decimals));
    await mintCADC(user1Address, parseUnits("1000", TOKENS.CADC.decimals));

    await mintUSDC(user2Address, parseUnits("1000", TOKENS.USDC.decimals));
    await mintCADC(user2Address, parseUnits("1000", TOKENS.CADC.decimals));

    await usdc.approve(curveAddress, ethers.constants.MaxUint256);
    await cadc.approve(curveAddress, ethers.constants.MaxUint256);

    await usdc.connect(user2).approve(curveAddress, ethers.constants.MaxUint256);
    await cadc.connect(user2).approve(curveAddress, ethers.constants.MaxUint256);

    // Proportional Supply
    tx = await curve.proportionalDeposit(parseUnits("200"), await getFutureTime());
    await tx.wait();
    tx = await curve.connect(user2).proportionalDeposit(parseUnits("200"), await getFutureTime());
    await tx.wait();

    console.log("Curve");
    await logTokenBalances(curveAddress);

    // Swap
    console.log("Swapping...");
    tx = await curve.originSwap(
      cadc.address,
      usdc.address,
      parseUnits("50", TOKENS.CADC.decimals),
      0,
      await getFutureTime(),
    );
    await tx.wait();

    tx = await curve.targetSwap(
      usdc.address,
      cadc.address,
      parseUnits("100", TOKENS.USDC.decimals),
      parseUnits("50", TOKENS.CADC.decimals),
      await getFutureTime(),
    );
    await tx.wait();

    console.log("User 1");
    await logTokenBalances(user1Address);
    console.log("User 2");
    await logTokenBalances(user2Address);
    console.log("Curve");
    await logTokenBalances(curveAddress);

    // Update oracle
    console.log("---- Update oracle pricing 1 CAD = 0.8 USD  ----");
    await updateOracleAnswer(ORACLES.CAD.address, parseUnits("0.8", ORACLES.CAD.decimals));

    // Swap again
    console.log("---- Swapping 1 USDC -> CADC ----");
    tx = await curve.originSwap(
      usdc.address,
      cadc.address,
      parseUnits("1", TOKENS.USDC.decimals),
      0,
      await getFutureTime(),
    );
    await tx.wait();
    console.log("User 1");
    await logTokenBalances(user1Address);

    // Proportional withdraw
    const curveLpToken = await ethers.getContractAt("ERC20", curveAddress);
    console.log("---- Withdrawing ----");
    await curve.connect(user2).proportionalWithdraw(await curveLpToken.balanceOf(user2Address), await getFutureTime());
    await curve.connect(user1).proportionalWithdraw(await curveLpToken.balanceOf(user1Address), await getFutureTime());

    console.log("User 1");
    await logTokenBalances(user1Address);
    console.log("User 2");
    await logTokenBalances(user2Address);
    console.log("Curve");
    await logTokenBalances(curveAddress);
  });
});
