import { ethers } from "hardhat";
import { ERC20, Curve } from "../../typechain";
import { Addresses } from "./addresses";
import { DfxPools } from "./addresses/dfx";
import { Chains } from "./constants";
import { Mint } from "./mint-utils";
import { getDeadlineEpochTime } from "./utils";
import { formatUnits } from "ethers/lib/utils";
import { Contract } from "ethers";
import { ValidChainId } from "./chainId";

type TokenInfo = {
  address: string;
  decimals: number;
  owner: string;
};

const chainId = 1337;

const { parseUnits } = ethers.utils;

/*** Helper functions ***/
// Add LP to DFX pool
async function addLp(forexToken: string, pool: Contract, amount: string) {
  console.log(`Adding liquidity to DFX ${forexToken.toUpperCase()}/USDC pool...`);
  await pool.deposit(parseUnits(amount), getDeadlineEpochTime("10")).then((x: any) => x.wait());
}

// Swap from forex token to USDC using DFX pool
async function swap(
  usdc: Contract,
  forexTokenContract: Contract,
  forexTokenInfo: TokenInfo,
  pool: Contract,
  amount: string,
) {
  const [user0] = await ethers.getSigners();

  const usdcBalance0 = await usdc.balanceOf(user0.address);
  const trybBalance0 = await forexTokenContract.balanceOf(user0.address);
  console.log("Pre-swap balance (USDC):", formatUnits(usdcBalance0, 6));
  console.log("Pre-swap balance (TRYB):", formatUnits(trybBalance0, forexTokenInfo.decimals));

  // Swap from forexToken to USDC
  await pool.originSwap(
    forexTokenContract.address,
    usdc.address,
    parseUnits(amount, forexTokenInfo.decimals),
    0,
    getDeadlineEpochTime("10"),
  );

  const usdcBalance1 = await usdc.balanceOf(user0.address);
  const trybBalance1 = await forexTokenContract.balanceOf(user0.address);
  console.log("Post-swap balance (USDC):", formatUnits(usdcBalance1, 6));
  console.log("Post-swap balance (TRYB):", formatUnits(trybBalance1, forexTokenInfo.decimals));
}

async function poolStats(usdc: Contract, forexTokenContract: Contract, pool: Contract) {
  const rawTotalSupply = await pool.totalSupply();
  const totalSupply = formatUnits(rawTotalSupply);

  const rawLiq = await pool.liquidity();
  const totalValueUsd = formatUnits(rawLiq[0], 18);
  const trybValueUsd = formatUnits(rawLiq[1][0], 18);
  const usdcValueUsd = formatUnits(rawLiq[1][1], 18);
  const trybRatio = Number(trybValueUsd) / Number(totalValueUsd);
  console.log(`total value locked : ${totalValueUsd}`);
  console.log(`tryb value locked : ${trybValueUsd}`);
  console.log(`usdc value locked : ${usdcValueUsd}`);
  console.log("\nTotal LPT:", totalSupply);
  console.log("Pool TRYB ratio:", trybRatio);
}

/**
 * This script adds liquidity to the DFX CADC/USDC pool,
 * in order to get the LPTs for it
 */
async function main() {
  const [user0] = await ethers.getSigners();

  // Set your params here
  const forexToken = "tryb";

  // Setup contracts
  const poolAddrs = {
    cadc: DfxPools[1][0].pool,
    xsgd: DfxPools[1][2].pool,
    tryb: DfxPools[1][DfxPools[1].length - 1].pool,
    nzds: DfxPools[1][DfxPools[1].length - 2].pool,
  };

  const poolAddr = poolAddrs[forexToken];

  console.log(chainId);
  const [pool, usdc, forexTokenContract] = await Promise.all([
    ethers.getContractAt("Curve", poolAddr) as Promise<Curve>,
    ethers.getContractAt("ERC20", Addresses[chainId].tokens.usdc) as Promise<ERC20>,
    ethers.getContractAt("ERC20", Addresses[chainId].tokens[forexToken]) as Promise<ERC20>,
  ]);

  // Mint
  console.log(`\nMinting ${forexToken.toUpperCase()} and USDC...`);
  await Promise.all([
    await Mint.usdc(user0.address, parseUnits("10000000000", Chains[chainId].Tokens.usdc.decimals), chainId),
    await Mint[forexToken](
      user0.address,
      parseUnits("10000000000", Chains[chainId].Tokens[forexToken].decimals),
      chainId,
    ),
  ]);

  // Approve
  console.log(`Approving ${forexToken.toUpperCase()} and USDC...`);
  await Promise.all([
    usdc.connect(user0).approve(poolAddr, ethers.constants.MaxUint256),
    forexTokenContract.connect(user0).approve(poolAddr, ethers.constants.MaxUint256),
  ]);

  /*** Add LP ***/
  const forexTokenInfo = Chains[chainId].Tokens[forexToken];

  console.log(`prior to any action, pool stats`);
  await poolStats(usdc, forexTokenContract, pool);
  // 1. Attempt to add too much LP and fail
  console.log("adding liquidity of 20000");
  await addLp(forexToken, pool, "20000");
  await poolStats(usdc, forexTokenContract, pool);

  // // 2. Attempt to progressively add LP and succeed

  await addLp(forexToken, pool, "100000000");
  await poolStats(usdc, forexTokenContract, pool);
  await addLp(forexToken, pool, "10000");
  await addLp(forexToken, pool, "12000");
  await addLp(forexToken, pool, "13000");
  await addLp(forexToken, pool, "14000");
  await addLp(forexToken, pool, "15000");

  // // 3. Swap and add LP and succeed
  await swap(forexTokenContract, usdc, forexTokenInfo, pool, "2000000");
  await addLp(forexToken, pool, "15000");

  // 4. Swap larger amounts
  await poolStats(usdc, forexTokenContract, pool);
  await swap(forexTokenContract, usdc, forexTokenInfo, pool, "150000");
  await poolStats(usdc, forexTokenContract, pool);
  await addLp(forexToken, pool, "10000");
  await poolStats(usdc, forexTokenContract, pool);
  await addLp(forexToken, pool, "12000");
  await poolStats(usdc, forexTokenContract, pool);
  await addLp(forexToken, pool, "13000");
  await addLp(forexToken, pool, "14000");
  await addLp(forexToken, pool, "15000");
  await addLp(forexToken, pool, "17000");

  console.log("Done!");
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
