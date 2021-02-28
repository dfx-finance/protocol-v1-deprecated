import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, ContractReceipt } from "ethers";
import { TOKENS } from "./Constants";
import { mintCADC, mintUSDC, getFutureTime } from "./Utils";

const { parseUnits } = ethers.utils;

const getCurveAddressFromTxRecp = (txRecp: ContractReceipt) => {
  const abi = ["event NewCurve(address indexed caller, address indexed curve)"];
  const iface = new ethers.utils.Interface(abi);

  const events = txRecp.logs
    .map(x => {
      try {
        return iface.parseLog(x);
      } catch (e) {
        return null;
      }
    })
    .filter(x => x !== null);

  return events[0]?.args[1];
};

describe("Curve", function () {
  let [user]: Signer[] = [];

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

  let CurveFactory: ContractFactory;

  let curveFactory: Contract;
  let usdc: Contract;
  let cadc: Contract;

  before(async function () {
    [user] = await ethers.getSigners();

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
  });

  beforeEach(async function () {
    curveFactory = await CurveFactory.deploy();

    usdc = await ethers.getContractAt("ERC20", TOKENS.USDC.address);
    cadc = await ethers.getContractAt("ERC20", TOKENS.CADC.address);
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
    ];
    const assetWeights = [parseUnits("0.5"), parseUnits("0.5")];
    const derivativeAssimilators = [usdcToUsdAssimilator.address, cadcToUsdAssimilator.address];

    let tx = await curveFactory.newCurve(assets, assetWeights, derivativeAssimilators);
    const txRecp = await tx.wait();

    // Get curve address from logs
    const curveAddress = getCurveAddressFromTxRecp(txRecp);
    const curve = await ethers.getContractAt("Curve", curveAddress);

    // Mint tokens and approve
    await mintUSDC(await user.getAddress(), parseUnits("100", 6));
    await mintCADC(await user.getAddress(), parseUnits("100"));
    await usdc.approve(curveAddress, parseUnits("100", 6));
    await cadc.approve(curveAddress, parseUnits("100"));

    // Set params
    tx = await curve.setParams(
      parseUnits("0.5"),
      parseUnits("0.25"),
      parseUnits("0.05"),
      parseUnits("2.5", 14),
      parseUnits("0.2"),
    );
    await tx.wait();

    // Proportional Supply
    tx = await curve.proportionalDeposit(parseUnits("100"), await getFutureTime());
    await tx.wait();

    console.log("usdc balance", await usdc.balanceOf(await user.getAddress()));
    console.log("cadc balance", await cadc.balanceOf(await user.getAddress()));

    // Swap
    tx = await curve.originSwap(usdc.address, cadc.address, parseUnits("1", 6), 0, await getFutureTime());
    await tx.wait();

    console.log("usdc balance", await usdc.balanceOf(await user.getAddress()));
    console.log("cadc balance", await cadc.balanceOf(await user.getAddress()));
  });
});
