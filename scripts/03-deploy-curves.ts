import hre from "hardhat";
import chalk from "chalk";

import { TOKENS } from "../test/Constants";
import { CurveFactory, Curve } from "../typechain";
import { getAccounts, getFastGasPrice } from "./common";
import { parseUnits } from "@ethersproject/units";

const { ethers } = hre;

// const GOVERNANCE = "0x27e843260c71443b4cc8cb6bf226c3f77b9695af";

const ASSIMILATOR_ADDRESSES = {
  cadcToUsdAssimilator: "0xe36DeD0aF2929870977F05A1f017BAB6CF8190f8",
  usdcToUsdAssimilator: "0x8F022C3e9f8F915Fd99c0E307059acD2B908D8E1",
  eursToUsdAssimilator: "0xD09607e80936f6abf35eee75E77115a93A5FE9D5",
  xsgdToUsdAssimilator: "0x58c88f583b26F59215F43633F4181F210379226E",
};

const ALPHA = parseUnits("0.8");
const BETA = parseUnits("0.5");
const MAX = parseUnits("0.15");
const EPSILON = parseUnits("0.0005");
const LAMBDA = parseUnits("0.3");

const CURVE_FACTORY = "0xAb23B50fC7835D0F1B892746992f28646305306C";

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const curveFactory = (await ethers.getContractAt("CurveFactory", CURVE_FACTORY)) as CurveFactory;

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
    // const tx3 = await curve.transferOwnership(GOVERNANCE, {
    //   gasPrice,
    //   gasLimit: 300000,
    // });
    // console.log("tx hash", tx3.hash);
    // await tx3.wait();
    // console.log("ownership xferred");

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
