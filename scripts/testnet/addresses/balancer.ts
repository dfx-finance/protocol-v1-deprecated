import { PoolInfo } from ".";

export const polygon: PoolInfo[] = [
  {
    id: "dfxTel",
    source: "balancer",
    pool: "0x96646936b91d6B9D7D0c47C496AfBF3D6ec7B6f8",
    lpt: "0x96646936b91d6B9D7D0c47C496AfBF3D6ec7B6f8",
    stakingDualRewardsLegacy: "0xd52D48Db08e8224ef6E2be8F54f3c84e790b1c32",
  },
  {
    id: "dfxTelUsdc",
    source: "balancer",
    pool: "0x2dbc9ab0160087ae59474fb7bed95b9e808fa6bc",
    lpt: "0x2dbc9ab0160087ae59474fb7bed95b9e808fa6bc",
    stakingRewardsMulti: "0xfAB274069A8203143c396B388fb4B6729FcC76Df",
  },
];

export const BalancerPools = {
  1: [],
  1337: [],
  137: polygon,
  1338: polygon,
};
