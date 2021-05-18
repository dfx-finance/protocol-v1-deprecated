import hre from "hardhat";
import chalk from "chalk";

import { TOKENS } from "../test/Constants";
import { CurveFactory, Curve } from "../typechain";
import { getAccounts, getFastGasPrice } from "./common";
import { parseUnits } from "@ethersproject/units";

const { ethers } = hre;

const GOVERNANCE = "0x27e843260c71443b4cc8cb6bf226c3f77b9695af";

const ASSIMILATOR_ADDRESSES = {
  cadcToUsdAssimilator: "0x12310b7726eaE2D2438361Fd126a25D8381Fe891",
  usdcToUsdAssimilator: "0x3CB209Dc9dDC45ce4Fd9a2f5DD33a8C6A9b6ea52",
  eursToUsdAssimilator: "0x39F45038D763dd88791cE9BdE8d6c18081c7d522",
  xsgdToUsdAssimilator: "0xe36DeD0aF2929870977F05A1f017BAB6CF8190f8",
};

const ALPHA = parseUnits("0.8");
const BETA = parseUnits("0.5");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0005");
const LAMBDA = parseUnits("0.3");

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const curveFactory = (await ethers.getContractAt(
    "CurveFactory",
    "0xd3C1bF5582b5f3029b15bE04a49C65d3226dFB0C",
  )) as CurveFactory;

  const createAndSetParams = async (name, symbol, base, quote, baseAssim, quoteAssim) => {
    console.log("creating ", name);
    let gasPrice = await getFastGasPrice();
    const tx = await curveFactory.newCurve(
      name,
      symbol,
      base,
      quote,
      parseUnits("0.5"),
      parseUnits("0.5"),
      baseAssim,
      quoteAssim,
      {
        gasPrice,
        gasLimit: 3300000,
      },
    );
    console.log("tx hash", tx.hash);
    const txRecp = await tx.wait();
    const newCurveAddress = txRecp.events.filter(x => x.event === "NewCurve")[0].args.curve;
    console.log("new curve", newCurveAddress);

    const curve = (await ethers.getContractAt("Curve", newCurveAddress)) as Curve;
    console.log("setting params");
    gasPrice = await getFastGasPrice();
    const tx2 = await curve.setParams(ALPHA, BETA, MAX, EPSILON, LAMBDA, {
      gasPrice,
      gasLimit: 300000,
    });
    console.log("tx hash", tx2.hash);
    await tx2.wait();
    console.log("params setted, transferring ownership");
    gasPrice = await getFastGasPrice();
    const tx3 = await curve.transferOwnership(GOVERNANCE, {
      gasPrice,
      gasLimit: 300000,
    });
    console.log("tx hash", tx3.hash);
    await tx3.wait();
    console.log("ownership xferred");

    console.log("==== done ====");
  };

  await createAndSetParams(
    "dfx-cadc-usdc-a",
    "dfx-cadc-a",
    TOKENS.CADC.address,
    TOKENS.USDC.address,
    ASSIMILATOR_ADDRESSES.cadcToUsdAssimilator,
    ASSIMILATOR_ADDRESSES.usdcToUsdAssimilator,
  );

  await createAndSetParams(
    "dfx-eurs-usdc-a",
    "dfx-eurs-a",
    TOKENS.EURS.address,
    TOKENS.USDC.address,
    ASSIMILATOR_ADDRESSES.eursToUsdAssimilator,
    ASSIMILATOR_ADDRESSES.usdcToUsdAssimilator,
  );

  await createAndSetParams(
    "dfx-xsgd-usdc-a",
    "dfx-xsgd-a",
    TOKENS.XSGD.address,
    TOKENS.USDC.address,
    ASSIMILATOR_ADDRESSES.xsgdToUsdAssimilator,
    ASSIMILATOR_ADDRESSES.usdcToUsdAssimilator,
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
