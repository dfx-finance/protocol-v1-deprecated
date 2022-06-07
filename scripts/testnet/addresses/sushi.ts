import { PoolInfo } from ".";

export const ethereum: PoolInfo[] = [
  {
    id: "dfxWeth",
    source: "sushi",
    pool: "0xBE71372995E8e920E4E72a29a51463677A302E8d",
    lpt: "0xBE71372995E8e920E4E72a29a51463677A302E8d",
    stakingRewards: "0xE690E93Fd96b2b8d1cdeCDe5F08422F3dd82e164",
  },
];

export const polygon: PoolInfo[] = [
  {
    id: "dfxWeth",
    source: "sushi",
    pool: "0x9AD5cDC89001A2eB0cc7713c788f843de881d803",
    lpt: "0x9AD5cDC89001A2eB0cc7713c788f843de881d803",
  },
];

export const SushiPools = {
  1: ethereum,
  1337: ethereum,
  137: polygon,
  1338: polygon,
};
