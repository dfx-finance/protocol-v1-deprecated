import { ethers } from "hardhat";

import { TOKENS } from "../../test/Constants";
import { mintCADC, mintEURS, mintUSDC, mintXSGD, getFutureTime } from "../../test/Utils";

import { CurveFactory } from "../../typechain/CurveFactory";
import { Curve } from "../../typechain/Curve";
import { ERC20 } from "../../typechain/ERC20";
import { Router } from "../../typechain/Router";
import { BigNumberish, Signer } from "ethers";
import { parseUnits } from "ethers/lib/utils";

const NAME = "DFX V1"
const SYMBOL = "DFX-V1"
const ALPHA = parseUnits("0.5");
const BETA = parseUnits("0.35");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0004");
const LAMBDA = parseUnits("0.3");

export const getDeployer = async (): Promise<{
  deployer: Signer;
  user1: Signer;
  user2: Signer;
}> => {
  const [deployer, user1, user2] = await ethers.getSigners();
  return {
    deployer,
    user1,
    user2,
  };
};

async function main() {
  const { deployer } = await getDeployer();

  console.log(`Setting up scaffolding at network ${ethers.provider.connection.url}`);
  console.log(`Deployer account: ${await deployer.getAddress()}`);

  const CurvesLib = await ethers.getContractFactory("Curves");
  const OrchestratorLib = await ethers.getContractFactory("Orchestrator");
  const ProportionalLiquidityLib = await ethers.getContractFactory("ProportionalLiquidity");
  const SwapsLib = await ethers.getContractFactory("Swaps");
  const ViewLiquidityLib = await ethers.getContractFactory("ViewLiquidity");

  const curvesLib = await CurvesLib.deploy();
  const orchestratorLib = await OrchestratorLib.deploy();
  const proportionalLiquidityLib = await ProportionalLiquidityLib.deploy();
  const swapsLib = await SwapsLib.deploy();
  const viewLiquidityLib = await ViewLiquidityLib.deploy();

  const CadcToUsdAssimilator = await ethers.getContractFactory("CadcToUsdAssimilator");
  const UsdcToUsdAssimilator = await ethers.getContractFactory("UsdcToUsdAssimilator");
  const EursToUsdAssimilator = await ethers.getContractFactory("EursToUsdAssimilator");
  const XsgdToUsdAssimilator = await ethers.getContractFactory("XsgdToUsdAssimilator");

  const cadcToUsdAssimilator = await CadcToUsdAssimilator.deploy({ gasLimit: 12000000 });
  const usdcToUsdAssimilator = await UsdcToUsdAssimilator.deploy({ gasLimit: 12000000 });
  const eursToUsdAssimilator = await EursToUsdAssimilator.deploy({ gasLimit: 12000000 });
  const xsgdToUsdAssimilator = await XsgdToUsdAssimilator.deploy({ gasLimit: 12000000 });

  const usdc = (await ethers.getContractAt("ERC20", TOKENS.USDC.address)) as ERC20;
  const cadc = (await ethers.getContractAt("ERC20", TOKENS.CADC.address)) as ERC20;
  const eurs = (await ethers.getContractAt("ERC20", TOKENS.EURS.address)) as ERC20;
  const xsgd = (await ethers.getContractAt("ERC20", TOKENS.XSGD.address)) as ERC20;  

  const erc20 = (await ethers.getContractAt("ERC20", ethers.constants.AddressZero)) as ERC20;

  const CurveFactory = await ethers.getContractFactory("CurveFactory", {
    libraries: {
      Curves: curvesLib.address,
      Orchestrator: orchestratorLib.address,
      ProportionalLiquidity: proportionalLiquidityLib.address,
      Swaps: swapsLib.address,
      ViewLiquidity: viewLiquidityLib.address,
    },
  });

  const RouterFactory = await ethers.getContractFactory("Router");

  const curveFactory = (await CurveFactory.deploy({ gasLimit: 12000000 })) as CurveFactory;
  const router = (await RouterFactory.deploy(curveFactory.address, { gasLimit: 12000000 })) as Router;

  const createCurve = async function ({
    name,
    symbol,
    base,
    quote,
    baseWeight,
    quoteWeight,
    baseAssimilator,
    quoteAssimilator,
  }: {
    name: string;
    symbol: string;
    base: string;
    quote: string;
    baseWeight: BigNumberish;
    quoteWeight: BigNumberish;
    baseAssimilator: string;
    quoteAssimilator: string;
  }): Promise<{ curve: Curve; curveLpToken: ERC20 }> {
    const tx = await curveFactory.newCurve(name, symbol, base, quote, baseWeight, quoteWeight, baseAssimilator, quoteAssimilator, {
      gasLimit: 12000000,
    });
    await tx.wait();

    // Get curve address
    const curveAddress = await curveFactory.curves(
      ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["address", "address"], [base, quote])),
    );
    const curveLpToken = (await ethers.getContractAt("ERC20", curveAddress)) as ERC20;
    const curve = (await ethers.getContractAt("Curve", curveAddress)) as Curve;

    return {
      curve,
      curveLpToken,
    };
  };

  const createCurveAndSetParams = async function ({
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
  }) {
    const { curve, curveLpToken } = await createCurve({
      name,
      symbol,
      base,
      quote,
      baseWeight,
      quoteWeight,
      baseAssimilator,
      quoteAssimilator,
    });

    const tx = await curve.setParams(...params, { gasLimit: 12000000 });
    await tx.wait();

    return {
      curve,
      curveLpToken,
    };
  };

  const mintAndApprove = async function (
    tokenAddress: string,
    minter: Signer,
    amount: BigNumberish,
    recipient: string,
  ) {
    const minterAddress = await minter.getAddress();

    if (tokenAddress.toLowerCase() === TOKENS.USDC.address.toLowerCase()) {
      await mintUSDC(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.CADC.address.toLowerCase()) {
      await mintCADC(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.EURS.address.toLowerCase()) {
      await mintEURS(minterAddress, amount);
    }

    if (tokenAddress.toLowerCase() === TOKENS.XSGD.address.toLowerCase()) {
      await mintXSGD(minterAddress, amount);
    }

    await erc20.attach(tokenAddress).connect(minter).approve(recipient, amount);
  };

  const multiMintAndApprove = async function (requests: [string, Signer, BigNumberish, string][]) {
    for (let i = 0; i < requests.length; i++) {
      await mintAndApprove(...requests[i]);
    }
  };

  const { curve: curveCADC } = await createCurveAndSetParams({
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

  const { curve: curveXSGD } = await createCurveAndSetParams({
    name: NAME,
    symbol: SYMBOL,
    base: xsgd.address,
    quote: usdc.address,
    baseWeight: parseUnits("0.5"),
    quoteWeight: parseUnits("0.5"),
    baseAssimilator: xsgdToUsdAssimilator.address,
    quoteAssimilator: usdcToUsdAssimilator.address,
    params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
  });

  const { curve: curveEURS } = await createCurveAndSetParams({
    name: NAME,
    symbol: SYMBOL,
    base: eurs.address,
    quote: usdc.address,
    baseWeight: parseUnits("0.5"),
    quoteWeight: parseUnits("0.5"),
    baseAssimilator: eursToUsdAssimilator.address,
    quoteAssimilator: usdcToUsdAssimilator.address,
    params: [ALPHA, BETA, MAX, EPSILON, LAMBDA],
  });

  // Supply liquidity to the pools
  // Mint tokens and approve
  await multiMintAndApprove([
    [TOKENS.USDC.address, deployer, parseUnits("10000000", TOKENS.USDC.decimals), curveCADC.address],
    [TOKENS.CADC.address, deployer, parseUnits("10000000", TOKENS.CADC.decimals), curveCADC.address],
    [TOKENS.USDC.address, deployer, parseUnits("10000000", TOKENS.USDC.decimals), curveXSGD.address],
    [TOKENS.XSGD.address, deployer, parseUnits("10000000", TOKENS.XSGD.decimals), curveXSGD.address],
    [TOKENS.USDC.address, deployer, parseUnits("10000000", TOKENS.USDC.decimals), curveEURS.address],
    [TOKENS.EURS.address, deployer, parseUnits("10000000", TOKENS.EURS.decimals), curveEURS.address],
  ]);

  await curveCADC
    .connect(deployer)
    .deposit(parseUnits("10000000"), await getFutureTime())
    .then(x => x.wait());

  await curveXSGD
    .connect(deployer)
    .deposit(parseUnits("10000000"), await getFutureTime())
    .then(x => x.wait());

  await curveEURS
    .connect(deployer)
    .deposit(parseUnits("10000000"), await getFutureTime())
    .then(x => x.wait());

  console.log(`Scaffolding done. Each pool is initialized with 10mil USD liquidity`);
  console.log(
    JSON.stringify(
      {
        curveFactory: curveFactory.address,
        curveCADC: curveCADC.address,
        curveXSGD: curveXSGD.address,
        curveEURS: curveEURS.address,
        router: router.address,
      },
      null,
      4,
    ),
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
