// SPDX-License-Identifier: MIT

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is disstributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.3;

// Finds new Curves! logs their addresses and provides `isCurve(address) -> (bool)`

import "./Curve.sol";

import "./interfaces/IFreeFromUpTo.sol";

import "./interfaces/ICurveFactory.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

import  "hardhat/console.sol";




contract CurveFactory is ICurveFactory, Ownable {

    // add protocol fee
    int128 public totoalFeePercentage = 100;
    int128 public protocolFee;
    address public protocolTreasury;

    event NewCurve(address indexed caller, bytes32 indexed id, address indexed curve);

    mapping(bytes32 => address) public curves;

    constructor(int128 _protocolFee, address _treasury) Ownable() {
        require(totoalFeePercentage >= _protocolFee, "protocol fee can't be over 100%");
        require(_treasury != address(0), "invalid treasury address");
        protocolFee = uint8(_protocolFee);
        protocolTreasury = _treasury;
    }

    function getProtocolFee() virtual external view override returns (int128) {
        console.logString("get protocol fee addr is");
        console.log(address(this));
        return protocolFee;
    }

    function getProtocolTreasury() virtual external view override returns(address) {
        console.logString("get protocol treasury addr is");
        console.log(address(this));
        return protocolTreasury;
    }

    function getCurve(address _baseCurrency, address _quoteCurrency) external view returns (address) {
        bytes32 curveId = keccak256(abi.encode(_baseCurrency, _quoteCurrency));
        return (curves[curveId]);
    }

    function newCurve(
        string memory _name,
        string memory _symbol,
        address _baseCurrency,
        address _quoteCurrency,
        uint256 _baseWeight,
        uint256 _quoteWeight,
        address _baseAssimilator,
        address _quoteAssimilator
    ) public onlyOwner returns (Curve) {
        bytes32 curveId = keccak256(abi.encode(_baseCurrency, _quoteCurrency));
        if (curves[curveId] != address(0)) revert("CurveFactory/currency-pair-already-exists");

        address[] memory _assets = new address[](10);
        uint256[] memory _assetWeights = new uint256[](2);

        // Base Currency
        _assets[0] = _baseCurrency;
        _assets[1] = _baseAssimilator;
        _assets[2] = _baseCurrency;
        _assets[3] = _baseAssimilator;
        _assets[4] = _baseCurrency;

        // Quote Currency (typically USDC)
        _assets[5] = _quoteCurrency;
        _assets[6] = _quoteAssimilator;
        _assets[7] = _quoteCurrency;
        _assets[8] = _quoteAssimilator;
        _assets[9] = _quoteCurrency;

        // Weights
        _assetWeights[0] = _baseWeight;
        _assetWeights[1] = _quoteWeight;

        // New curve
        Curve curve = new Curve(_name, _symbol, _assets, _assetWeights, address(this));
        curve.transferOwnership(msg.sender);
        curves[curveId] = address(curve);

        emit NewCurve(msg.sender, curveId, address(curve));

        return curve;
    }
}
