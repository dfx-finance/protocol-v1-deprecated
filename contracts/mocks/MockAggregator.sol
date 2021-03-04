// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

contract MockAggregator {
    uint256 internal _answer;

    function setAnswer(uint256 _a) external {
        _answer = _a;
    }

    function latestAnswer() external view returns (uint256) {
        return _answer;
    }
}
