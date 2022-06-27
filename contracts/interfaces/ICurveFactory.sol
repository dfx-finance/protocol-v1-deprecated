// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface ICurveFactory {
    function getProtocolFee() external view returns (int128);

    function getProtocolTreasury() external view returns (address);
}
