// SPDX-License-Identifier: MIT
pragma solidity ^0.7.3;

interface ICurveFactory {
    function getProtocolFee () virtual external view returns (int128);
    function getProtocolTreasury () virtual external view returns (address); 
}