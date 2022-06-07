import { Addresses } from "./addresses";

const ethereum = {
  Tokens: {
    xidr: {
      address: Addresses[1].tokens.xidr,
      masterMinter: "0x3f02a96ce54f043efad2c35ddb0c42cc5777df13",
      decimals: 6,
    },
    tryb: {
      address: Addresses[1].tokens.tryb,
      owner: "0x2cb773ce3f159fa63cfb26e4becb61727b634103",
      decimals: 6,
    },
    nzds: {
      address: Addresses[1].tokens.nzds,
      owner: "0x34f2cf46cd43e995265ba372d91aea006d3c5252",
      decimals: 6,
    },
    xsgd: {
      address: Addresses[1].tokens.xsgd,
      masterMinter: "0x8c3b0cAeC968b2e640D96Ff0B4c929D233B25982",
      decimals: 6,
    },
    eurs: {
      address: Addresses[1].tokens.eurs,
      owner: "0x2ebbbc541e8f8f24386fa319c79ceda0579f1efb",
      decimals: 2,
    },
    cadc: {
      address: Addresses[1].tokens.cadc,
      owner: "0x3e30d340c83d068d632e11b5a30507ce973d7700",
      decimals: 18,
    },
    usdc: {
      address: Addresses[1].tokens.usdc,
      owner: "0xfcb19e6a322b27c06842a71e8c725399f049ae3a",
      decimals: 6,
    },
    dfx: {
      address: Addresses[1].tokens.dfx,
      owner: "0x27e843260c71443b4cc8cb6bf226c3f77b9695af",
      decimals: 18,
    },
    tel: {
      address: Addresses[1].tokens.tel,
      owner: null,
      decimals: 2,
    },
  },
  Oracles: {
    cadc: {
      address: "0xa34317DB73e77d453b1B8d04550c44D10e981C8e",
      decimals: 8,
    },
    eurs: {
      address: "0xb49f677943BC038e9857d61E7d053CaA2C1734C1",
      decimals: 8,
    },
    xsgd: {
      address: "0xe25277fF4bbF9081C75Ab0EB13B4A13a721f3E13",
      decimals: 8,
    },
    usdc: {
      address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      decimals: 8,
    },
  },
};

const polygon = {
  Tokens: {
    xsgd: {
      address: Addresses[137].tokens.xsgd,
      masterMinter: "0x8c3b0cAeC968b2e640D96Ff0B4c929D233B25982",
      decimals: 6,
    },
    eurs: {
      address: Addresses[137].tokens.eurs,
      owner: "0x2ebbbc541e8f8f24386fa319c79ceda0579f1efb",
      decimals: 2,
    },
    cadc: {
      address: Addresses[137].tokens.cadc,
      owner: "0xa0f5c8e8bcbdf066643c2ea8484cba7a3aff01f9",
      decimals: 18,
    },
    usdc: {
      address: Addresses[137].tokens.usdc,
      owner: "0xfcb19e6a322b27c06842a71e8c725399f049ae3a",
      decimals: 6,
    },
    dfx: {
      address: Addresses[137].tokens.dfx,
      owner: "0x27e843260c71443b4cc8cb6bf226c3f77b9695af",
      decimals: 18,
    },
    tel: {
      address: Addresses[137].tokens.tel,
      owner: null,
      decimals: 2,
    },
    nzds: {
      address: Addresses[137].tokens.nzds,
      owner: "0x34f2cf46cd43e995265ba372d91aea006d3c5252",
      decimals: 6,
    },
    tryb: {
      address: Addresses[137].tokens.tryb,
      owner: "0x2cb773ce3f159fa63cfb26e4becb61727b634103",
      decimals: 6,
    },
  },
  Oracles: {
    cadc: {
      address: "0xACA44ABb8B04D07D883202F99FA5E3c53ed57Fb5",
      decimals: 8,
    },
    eurs: {
      address: "0x73366Fe0AA0Ded304479862808e02506FE556a98",
      decimals: 8,
    },
    xsgd: {
      address: "0x8CE3cAc0E6635ce04783709ca3CC4F5fc5304299",
      decimals: 8,
    },
    usdc: {
      address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      decimals: 8,
    },
  },
};

export const Chains = {
  1: ethereum,
  137: polygon,
  1337: ethereum,
  1338: polygon,
};
