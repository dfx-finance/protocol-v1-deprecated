import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory } from "ethers";

const { parseUnits } = ethers.utils;

describe("Curve", function () {
  let accounts: Signer[];

  let CurvesLib: ContractFactory;
  let OrchestratorLib: ContractFactory;
  let PartitionedLiquidityLib: ContractFactory;
  let ProportionalLiquidityLib: ContractFactory;
  let SelectiveLiquidityLib: ContractFactory;
  let SwapsLib: ContractFactory;
  let ViewLiquidityLib: ContractFactory;

  let CadcToUsdAssimilator: ContractFactory;
  let UsdcToUsdAssimilator: ContractFactory;

  let curvesLib: Contract;
  let orchestratorLib: Contract;
  let partitionedLiquidityLib: Contract;
  let proportionalLiquidityLib: Contract;
  let selectiveLiquidityLib: Contract;
  let swapsLib: Contract;
  let viewLiquidityLib: Contract;

  let cadcToUsdAssimilator: Contract;
  let usdcToUsdAssimilator: Contract;

  let MockToken: ContractFactory;
  let CurveFactory: ContractFactory;

  let curveFactory: Contract;
  let usdc: Contract;
  let cadc: Contract;

  before(async function () {
    accounts = await ethers.getSigners();

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
    UsdcToUsdAssimilator = await ethers.getContractFactory("UsdcToUsdcAssimilator");

    cadcToUsdAssimilator = await CadcToUsdAssimilator.deploy();
    usdcToUsdAssimilator = await UsdcToUsdAssimilator.deploy();

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
    MockToken = await ethers.getContractFactory("MockToken");
  });

  beforeEach(async function () {
    curveFactory = await CurveFactory.deploy();

    usdc = await MockToken.deploy("USD Coin", "USDC", 8);
    cadc = await MockToken.deploy("CAD Coin", "CADC", 18);
  });

  it("new factory", async function () {
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
    ];
    const assetWeights = [parseUnits("0.5"), parseUnits("0.5")];
    const derivativeAssimilators = [usdcToUsdAssimilator.address, cadcToUsdAssimilator.address];

    const tx = await curveFactory.newCurve(assets, assetWeights, derivativeAssimilators);
    const txRecp = await tx.wait();

    console.log(txRecp);
    console.log(await accounts[0].getAddress());
  });
});
