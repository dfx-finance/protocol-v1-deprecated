// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

import "./ChainlinkOracle.sol";

contract OracleFactory {
    mapping(bytes32 => address) public oracles;

    function newOracle(
        address _token,
        string memory _name,
        uint8 _decimals,
        int256 _price
    ) external returns (ChainLinkOracle) {
        bytes32 oracleID = keccak256(abi.encode(_token));
        if (oracles[oracleID] != address(0)) {
            return ChainLinkOracle(oracles[oracleID]);
        } else {
            ChainLinkOracle _oracle = new ChainLinkOracle(_token, _name, _decimals, _price);
            oracles[oracleID] = address(_oracle);
            return _oracle;
        }
    }

    function getOracle(address _underlying) external view returns (address) {
        return oracles[keccak256(abi.encode(_underlying))];
    }
}
