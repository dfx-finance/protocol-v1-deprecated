// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

interface ICurveFactory {
    function getProtocolFee() external view returns (int128);

    function getProtocolTreasury() external view returns (address);
}
