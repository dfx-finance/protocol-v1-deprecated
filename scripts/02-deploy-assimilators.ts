import hre from "hardhat";
import chalk from "chalk";
import path from "path";
import fs from "fs";

import { getAccounts, deployContract } from "./common";

const { ethers } = hre;

async function main() {
  const { user } = await getAccounts();

  console.log(chalk.blue(`>>>>>>>>>>>> Network: ${(hre.network.config as any).url} <<<<<<<<<<<<`));
  console.log(chalk.blue(`>>>>>>>>>>>> Deployer: ${user.address} <<<<<<<<<<<<`));

  const CadcToUsdAssimilator = await ethers.getContractFactory("CadcToUsdAssimilator");
  const UsdcToUsdAssimilator = await ethers.getContractFactory("UsdcToUsdAssimilator");
  const EursToUsdAssimilator = await ethers.getContractFactory("EursToUsdAssimilator");
  const XsgdToUsdAssimilator = await ethers.getContractFactory("XsgdToUsdAssimilator");

  const cadcToUsdAssimilator = await deployContract({
    name: "CadcToUsdAssimilator",
    deployer: user,
    factory: CadcToUsdAssimilator,
    args: [],
    opts: {
      gasLimit: 2000000,
    },
  });

  const usdcToUsdAssimilator = await deployContract({
    name: "UsdcToUsdAssimilator",
    deployer: user,
    factory: UsdcToUsdAssimilator,
    args: [],
    opts: {
      gasLimit: 2000000,
    },
  });

  const eursToUsdAssimilator = await deployContract({
    name: "EursToUsdAssimilator",
    deployer: user,
    factory: EursToUsdAssimilator,
    args: [],
    opts: {
      gasLimit: 2000000,
    },
  });

  const xsgdToUsdAssimilator = await deployContract({
    name: "XsgdToUsdAssimilator",
    deployer: user,
    factory: XsgdToUsdAssimilator,
    args: [],
    opts: {
      gasLimit: 2000000,
    },
  });

  const output = {
    cadcToUsdAssimilator: cadcToUsdAssimilator.address,
    usdcToUsdAssimilator: usdcToUsdAssimilator.address,
    eursToUsdAssimilator: eursToUsdAssimilator.address,
    xsgdToUsdAssimilator: xsgdToUsdAssimilator.address,
  };

  const outputPath = path.join(__dirname, new Date().getTime().toString() + `_assimilators_deployed.json`);
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 4));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
