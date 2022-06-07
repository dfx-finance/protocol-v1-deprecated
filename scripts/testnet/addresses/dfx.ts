import { PoolInfo } from "."

export const ethereum: PoolInfo[] = [
  {
    id: "cadcUsdc",
    source: "dfx",
    pool: "0xa6c0cbcaebd93ad3c6c94412ec06aaa37870216d",
    lpt: "0xa6c0cbcaebd93ad3c6c94412ec06aaa37870216d",
    stakingRewards: "0x84Bf8151394dcF32146965753B28760550f3D7A8",
    oracle: "0xa34317DB73e77d453b1B8d04550c44D10e981C8e",
  },
  {
    id: "eursUsdc",
    source: "dfx",
    pool: "0x1a4Ffe0DCbDB4d551cfcA61A5626aFD190731347",
    lpt: "0x1a4Ffe0DCbDB4d551cfcA61A5626aFD190731347",
    stakingRewards: "0x5EaAEff69f2aB64d1CC0244FB31B236cA989544f",
    oracle: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
  },
  {
    id: "xsgdUsdc",
    source: "dfx",
    pool: "0x2baB29a12a9527a179Da88F422cDaaA223A90bD5",
    lpt: "0x2baB29a12a9527a179Da88F422cDaaA223A90bD5",
    stakingRewards: "0xd52D48Db08e8224ef6E2be8F54f3c84e790b1c32",
    oracle: "0xe25277fF4bbF9081C75Ab0EB13B4A13a721f3E13",
  },
  {
    id: "xidrUsdc",
    source: "dfx",
    pool: "0xdd39379ab7c93b9baae29e6ec03795d0bc99a889",
    lpt: "0xdd39379ab7c93b9baae29e6ec03795d0bc99a889",
    stakingRewards: "0xe29b7285c1169a9765e2a9bfe74209077bee55d6",
    oracle: "0x91b99C9b75aF469a71eE1AB528e8da994A5D7030",
  },
  {
    id: "nzdsUsdc",
    source: "dfx",
    pool: "0xe9669516e09f5710023566458f329cce6437aaac",
    lpt: "0xe9669516e09f5710023566458f329cce6437aaac",
    stakingRewards: "0xe06FA52e0d2D58Fe192285bfa0507F09cDd9824a",
    oracle: "0x3977CFc9e4f29C184D4675f4EB8e0013236e5f3e",
  },
  {
    id: "trybUsdc",
    source: "dfx",
    pool: "0xc574a613a3900e4314da13eb2287f13689a5b64d",
    lpt: "0xc574a613a3900e4314da13eb2287f13689a5b64d",
    stakingRewards: "0xddb720069fdfe7be2e2883a1c06be0f353f7c4c8",
    oracle: "0xB09fC5fD3f11Cf9eb5E1C5Dba43114e3C9f477b5",
  },
] 

export const polygon: PoolInfo[] = [
  {
    id: "cadcUsdc",
    source: "dfx",
    pool: "0x288Ab1b113C666Abb097BB2bA51B8f3759D7729e",
    lpt: "0x288Ab1b113C666Abb097BB2bA51B8f3759D7729e",
    stakingRewardsMulti: "0xa523959588E51B5BeA8D39fd861ab34101181A19",
    stakingRewardsMultiLegacy: "0x416e075c7893ceae8e4531655fb7725b79f86e10",
    oracle: "0xACA44ABb8B04D07D883202F99FA5E3c53ed57Fb5",
  },
  {
    id: "eursUsdc",
    source: "dfx",
    pool: "0xB72d390E07F40D37D42dfCc43E954Ae7c738Ad44",
    lpt: "0xB72d390E07F40D37D42dfCc43E954Ae7c738Ad44",
    stakingRewardsMulti: "0x419062c0DbEC658a943333Bc783617C58D25F316",
    stakingRewardsMultiLegacy: "0xb748a5509246e0a47d20fb64343dbfad5b26dae7",
    oracle: "0x73366Fe0AA0Ded304479862808e02506FE556a98",
  },
  {
    id: "xsgdUsdc",
    source: "dfx",
    pool: "0x8e3e9cB46E593Ec0CaF4a1Dcd6DF3A79a87b1fd7",
    lpt: "0x8e3e9cB46E593Ec0CaF4a1Dcd6DF3A79a87b1fd7",
    stakingRewardsMulti: "0x600E825F058A93146acD5877084E7d4525c5d846",
    stakingRewardsMultiLegacy: "0x89141b3c8a35f5323853d8c8839488fc0b90aa4d",
    oracle: "0x8CE3cAc0E6635ce04783709ca3CC4F5fc5304299",
  },
  {
    id: "nzds",
    source: "dfx",
    pool: "0x931d6a6cc3f992beee80a1a14a6530d34104b000",
    lpt: "0x931d6a6cc3f992beee80a1a14a6530d34104b000",
    stakingRewardsMulti: "0x308Ce99A085a25A9C3D0f2b96bb511017e955711",
    stakingRewardsMultiLegacy: "0x6e01699ef5c36dce95d627b2e29e8323a086122c",
    oracle: "0xa302a0B8a499fD0f00449df0a490DedE21105955",
  },
  {
    id: "trybUsdc",
    source: "dfx",
    pool: "0xea75cd0b12a8b48f5bddad37ceb15f8cb3d2cc75",
    lpt: "0xea75cd0b12a8b48f5bddad37ceb15f8cb3d2cc75",
    stakingRewardsMulti: "0x19914181a811ab9eb25c81d6df1972bf02c45cbe",
    stakingRewardsMultiLegacy: "0xfcbb946cbc0434a541433e97e835072f54a438f6",
    oracle: "0xd78325DcA0F90F0FFe53cCeA1B02Bb12E1bf8FdB",
  },
] 

export const DfxPools = {
  1: ethereum,
  1337: ethereum,
  137: polygon,
  1338: polygon,
}
