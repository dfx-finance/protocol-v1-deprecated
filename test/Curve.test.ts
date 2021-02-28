import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory } from "ethers";
import { TOKENS } from "./Constants";
import { mintCADC, mintUSDC, mintEURS, mintXSGD, getCurveAddressFromTxRecp, getFutureTime } from "./Utils";

const { parseUnits, formatUnits } = ethers.utils;

describe("Curve", function () {
  let [user]: Signer[] = [];
  let [userAddress]: string[] = [];

  let CurvesLib: ContractFactory;
  let OrchestratorLib: ContractFactory;
  let PartitionedLiquidityLib: ContractFactory;
  let ProportionalLiquidityLib: ContractFactory;
  let SelectiveLiquidityLib: ContractFactory;
  let SwapsLib: ContractFactory;
  let ViewLiquidityLib: ContractFactory;

  let CadcToUsdAssimilator: ContractFactory;
  let UsdcToUsdAssimilator: ContractFactory;
  let EursToUsdAssimilator: ContractFactory;
  let XsgdToUsdAssimilator: ContractFactory;

  let curvesLib: Contract;
  let orchestratorLib: Contract;
  let partitionedLiquidityLib: Contract;
  let proportionalLiquidityLib: Contract;
  let selectiveLiquidityLib: Contract;
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
    [user] = await ethers.getSigners();
    userAddress = await user.getAddress();

    CurvesLib = await ethers.getContractFactory("Curves");
    OrchestratorLib = await ethers.getContractFactory("Orchestrator");
    PartitionedLiquidityLib = await ethers.getContractFactory("PartitionedLiquidity");
    ProportionalLiquidityLib = await ethers.getContractFactory("ProportionalLiquidity");
    SelectiveLiquidityLib = await ethers.getContractFactory("SelectiveLiquidity");
    SwapsLib = await ethers.getContractFactory("Swaps");
    ViewLiquidityLib = await ethers.getContractFactory("ViewLiquidity");

    curvesLib = await CurvesLib.deploy();
    orchestratorLib = await OrchestratorLib.deploy();
    partitionedLiquidityLib = await PartitionedLiquidityLib.deploy();
    proportionalLiquidityLib = await ProportionalLiquidityLib.deploy();
    selectiveLiquidityLib = await SelectiveLiquidityLib.deploy();
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
        PartitionedLiquidity: partitionedLiquidityLib.address,
        ProportionalLiquidity: proportionalLiquidityLib.address,
        SelectiveLiquidity: selectiveLiquidityLib.address,
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

  it("new curve", async function () {
    const assets = [
      usdc.address,
      usdcToUsdAssimilator.address,
      usdc.address,
      usdcToUsdAssimilator.address,
      usdc.address,

      cadc.address,
      cadcToUsdAssimilator.address,
      cadc.address,
      cadcToUsdAssimilator.address,
      cadc.address,

      eurs.address,
      eursToUsdAssimilator.address,
      eurs.address,
      eursToUsdAssimilator.address,
      eurs.address,

      xsgd.address,
      xsgdToUsdAssimilator.address,
      xsgd.address,
      xsgdToUsdAssimilator.address,
      xsgd.address,
    ];
    const assetWeights = [parseUnits("0.25"), parseUnits("0.25"), parseUnits("0.25"), parseUnits("0.25")];
    // const assetWeights = [parseUnits("0.5"), parseUnits("0.5")];
    const derivativeAssimilators = [
      usdcToUsdAssimilator.address,
      cadcToUsdAssimilator.address,
      eursToUsdAssimilator.address,
      xsgdToUsdAssimilator.address,
    ];

    let tx = await curveFactory.newCurve(assets, assetWeights, derivativeAssimilators);
    const txRecp = await tx.wait();

    // Get curve address from logs
    const curveAddress = getCurveAddressFromTxRecp(txRecp);
    const curve = await ethers.getContractAt("Curve", curveAddress);

    // Mint tokens and approve
    await mintUSDC(userAddress, parseUnits("100000", TOKENS.USDC.decimals));
    await mintCADC(userAddress, parseUnits("100000", TOKENS.CADC.decimals));
    await mintXSGD(userAddress, parseUnits("100000", TOKENS.XSGD.decimals));
    await mintEURS(userAddress, parseUnits("100000", TOKENS.EURS.decimals));

    await usdc.approve(curveAddress, ethers.constants.MaxUint256);
    await cadc.approve(curveAddress, ethers.constants.MaxUint256);
    await xsgd.approve(curveAddress, ethers.constants.MaxUint256);
    await eurs.approve(curveAddress, ethers.constants.MaxUint256);

    // Set params
    tx = await curve.setParams(
      parseUnits("0.5"), // Alpha
      parseUnits("0.25"), // Beta
      parseUnits("0.05"), // Max
      parseUnits("2.5", 14), // Epsilon
      parseUnits("0.2"), // Lambda
    );
    await tx.wait();

    // Proportional Supply
    // 25.0 tokens will be supplied to each
    tx = await curve.proportionalDeposit(parseUnits("200000"), await getFutureTime());
    await tx.wait();

    // Swap
    await logTokenBalances(curveAddress);

    console.log("Swapping ...");
    tx = await curve.originSwap(
      cadc.address,
      eurs.address,
      parseUnits("1", TOKENS.CADC.decimals),
      0,
      await getFutureTime(),
    );
    await tx.wait();

    await logTokenBalances(curveAddress);

    console.log("View origin swap");
    let amount = await curve.viewOriginSwap(cadc.address, eurs.address, parseUnits("1", TOKENS.CADC.decimals));
    console.log(`1 CADC -> ${formatUnits(amount, TOKENS.EURS.decimals)} EURS`);
    amount = await curve.viewOriginSwap(cadc.address, xsgd.address, parseUnits("1", TOKENS.CADC.decimals));
    console.log(`1 CADC -> ${formatUnits(amount, TOKENS.XSGD.decimals)} XSGD`);
    amount = await curve.viewOriginSwap(cadc.address, usdc.address, parseUnits("1", TOKENS.CADC.decimals));
    console.log(`1 CADC -> ${formatUnits(amount, TOKENS.USDC.decimals)} USDC`);

    amount = await curve.viewOriginSwap(eurs.address, cadc.address, parseUnits("1", TOKENS.EURS.decimals));
    console.log(`1 EURS -> ${formatUnits(amount, TOKENS.CADC.decimals)} CADC`);
    amount = await curve.viewOriginSwap(eurs.address, xsgd.address, parseUnits("1", TOKENS.EURS.decimals));
    console.log(`1 EURS -> ${formatUnits(amount, TOKENS.XSGD.decimals)} XSGD`);
    amount = await curve.viewOriginSwap(eurs.address, usdc.address, parseUnits("1", TOKENS.EURS.decimals));
    console.log(`1 EURS -> ${formatUnits(amount, TOKENS.USDC.decimals)} USDC`);

    amount = await curve.viewOriginSwap(xsgd.address, cadc.address, parseUnits("1", TOKENS.XSGD.decimals));
    console.log(`1 XSGD -> ${formatUnits(amount, TOKENS.CADC.decimals)} CADC`);
    amount = await curve.viewOriginSwap(xsgd.address, eurs.address, parseUnits("1", TOKENS.XSGD.decimals));
    console.log(`1 XSGD -> ${formatUnits(amount, TOKENS.EURS.decimals)} EURS`);
    amount = await curve.viewOriginSwap(xsgd.address, usdc.address, parseUnits("1", TOKENS.XSGD.decimals));
    console.log(`1 XSGD -> ${formatUnits(amount, TOKENS.USDC.decimals)} USDC`);

    amount = await curve.viewOriginSwap(usdc.address, cadc.address, parseUnits("1", TOKENS.USDC.decimals));
    console.log(`1 USDC -> ${formatUnits(amount, TOKENS.CADC.decimals)} CADC`);
    amount = await curve.viewOriginSwap(usdc.address, eurs.address, parseUnits("1", TOKENS.USDC.decimals));
    console.log(`1 USDC -> ${formatUnits(amount, TOKENS.EURS.decimals)} EURS`);
    amount = await curve.viewOriginSwap(usdc.address, xsgd.address, parseUnits("1", TOKENS.USDC.decimals));
    console.log(`1 USDC -> ${formatUnits(amount, TOKENS.XSGD.decimals)} XSGD`);
  });
});
