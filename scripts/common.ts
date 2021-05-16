import { ethers } from "hardhat";
import { formatUnits } from "ethers/lib/utils";

import readline from "readline";
import chalk from "chalk";
import ora from "ora";

import { Contract, ContractFactory, Wallet } from "ethers";
import { TransactionResponse } from "@ethersproject/abstract-provider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const getAccounts = async () => {
  const [user] = await ethers.getSigners();

  return {
    user,
  };
};

export const ask = async (question: string, color: string = "orange"): Promise<string> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(chalk.keyword(color)(question), input => {
      resolve(input);
      rl.close();
    });
  });
};

export const getFastGasPrice = async () => {
  const gasPrice = await ethers.provider.getGasPrice();
  const fastGasPrice = gasPrice.mul(ethers.BigNumber.from(125)).div(ethers.BigNumber.from(100));

  return fastGasPrice;
};

export const executeTxWithFastGasPrice = async ({
  name,
  user,
  contract,
  method,
  args,
  opts,
}: {
  name: string;
  user: Wallet;
  contract: Contract;
  method: string;
  args: any[];
  opts?: any;
}) => {
  console.log(chalk.grey(`============ Contract ${name} at ${contract.address} ============`));

  const balance = await user.getBalance();
  console.log(chalk.blueBright(`User (${user.address}) balance: ${formatUnits(balance)} ETH`));

  const func = contract.interface.fragments.filter(
    x => x.type === "function" && x.name === method && x.inputs.length === args.length,
  );

  if (func.length <= 0) {
    console.log(chalk.red(`${name}: Unable to find function ${method} with ${args.length} parameters`));
    console.log(chalk.grey(`=========================================`));
    process.exit(0);
  }

  const displayArgs = func[0].inputs
    .map((x, i) => {
      return {
        [x.name]: args[i],
      };
    })
    .reduce((acc, x) => {
      return { ...acc, ...x };
    }, {});

  console.log(chalk.keyword("yellow")(`Executing \`${method}\` with the following args: `));
  console.log(chalk.keyword("yellow")(JSON.stringify(displayArgs, null, 4)));
  let confirmDeploy = await ask("Continue? (y/n): ");

  while (confirmDeploy === "" || (confirmDeploy !== "y" && confirmDeploy !== "n")) {
    confirmDeploy = await ask("Continue? (y/n): ");
  }

  if (confirmDeploy.toLowerCase() !== "y") {
    console.log(chalk.keyword("red")("Contract interaction cancelled"));
    console.log(chalk.grey(`=========================================`));
    process.exit(0);
  }

  let gasPrice;
  if (opts && "gasPrice" in opts) {
    gasPrice = opts.gasPrice;
  } else {
    gasPrice = await getFastGasPrice();
  }

  let tx: TransactionResponse;

  const spinner = ora(`${name}: invoking ${method} with gasPrice ${formatUnits(gasPrice, 9)} gwei`).start();

  try {
    tx = await contract.connect(user)[method](...args, { ...opts, gasPrice });
    await tx.wait();
    spinner.succeed(`Invoked \`${method}\` at ${tx.hash}`);
  } catch (e) {
    spinner.fail(`${name}: ${method} failed with ${e.toString()}`);
  }

  console.log(chalk.grey(`=========================================`));
};

export const deployContract = async ({
  name,
  deployer,
  factory,
  args,
  opts,
}: {
  name: string;
  deployer: SignerWithAddress;
  factory: ContractFactory;
  args: any[];
  opts?: any;
}): Promise<Contract> => {
  console.log(chalk.grey(`============ Contract ${name} ============`));

  const balance = await deployer.getBalance();
  console.log(chalk.blueBright(`Deployer balance: ${formatUnits(balance)} ETH`));

  if (factory.interface.deploy.inputs) {
    if (factory.interface.deploy.inputs.length !== args.length) {
      console.log(
        chalk.red(`${name} expected ${factory.interface.deploy.inputs.length} arguments, got ${args.length}`),
      );
      console.log(chalk.grey(`=========================================`));
      process.exit(0);
    }
  }

  const displayArgs = factory.interface.deploy.inputs
    .map((x, i) => {
      return {
        [x.name]: args[i],
      };
    })
    .reduce((acc, x) => {
      return { ...acc, ...x };
    }, {});

  console.log(chalk.keyword("orange")(`Deploy ${name} with the following args: `));
  console.log(chalk.keyword("orange")(JSON.stringify(displayArgs, null, 4)));
  let confirmDeploy = await ask("Continue? (y/n): ");

  while (confirmDeploy === "" || (confirmDeploy !== "y" && confirmDeploy !== "n")) {
    confirmDeploy = await ask("Continue? (y/n): ");
  }

  if (confirmDeploy.toLowerCase() !== "y") {
    console.log(chalk.keyword("red")("Contract deployment cancelled"));
    console.log(chalk.grey(`=========================================`));
    process.exit(0);
  }

  let gasPrice;
  if (opts && "gasPrice" in opts) {
    gasPrice = opts.gasPrice;
  } else {
    gasPrice = await getFastGasPrice();
  }

  const spinner = ora(`Deploying ${name} with gasPrice ${formatUnits(gasPrice, 9)} gwei`).start();

  let contract;
  try {
    contract = await factory.connect(deployer).deploy(...args, {
      ...opts,
      gasPrice,
    });
    await contract.deployed();
    spinner.succeed(`Deployed ${name} to ${contract.address}`);
  } catch (e) {
    contract = null;
    spinner.fail(`Failed to deploy: ${e.toString()}`);
  }
  console.log(chalk.grey(`=========================================`));

  if (contract === null) {
    process.exit(0);
  }

  return contract;
};
