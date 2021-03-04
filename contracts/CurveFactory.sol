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

import "@openzeppelin/contracts/access/Ownable.sol";

contract CurveFactory is Ownable {
    event NewCurve(address indexed caller, address indexed curve);

    mapping(address => bool) public isCurve;

    function newCurve(
        address _baseCurrency,
        address _quoteCurrency,
        uint256 _baseWeight,
        uint256 _quoteWeight,
        address _baseAssimilator,
        address _quoteAssimilator
    ) public onlyOwner returns (Curve) {
        address[] memory _assets = new address[](10);
        uint256[] memory _assetWeights = new uint256[](2);
        address[] memory _derivativeAssimilators = new address[](2);

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

        // Assimilators
        _derivativeAssimilators[0] = _baseAssimilator;
        _derivativeAssimilators[1] = _quoteAssimilator;

        // New curve
        Curve curve = new Curve(_assets, _assetWeights, _derivativeAssimilators);
        curve.transferOwnership(msg.sender);
        isCurve[address(curve)] = true;
        emit NewCurve(msg.sender, address(curve));

        return curve;
    }
}
