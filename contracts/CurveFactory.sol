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

contract CurveFactory {
    address private dfx;

    event NewCurve(address indexed caller, address indexed curve);

    event DFXSet(address indexed caller, address indexed dfx);

    mapping(address => bool) private _isCurve;

    function isCurve(address _curve) external view returns (bool) {
        return _isCurve[_curve];
    }

    function newCurve(
        address[] memory _assets,
        uint256[] memory _assetWeights,
        address[] memory _derivativeAssimilators
    ) public returns (Curve) {
        if (msg.sender != dfx) revert("Curve/must-be-dfx");

        Curve curve = new Curve(_assets, _assetWeights, _derivativeAssimilators);

        curve.transferOwnership(msg.sender);

        _isCurve[address(curve)] = true;

        emit NewCurve(msg.sender, address(curve));

        return curve;
    }

    constructor() {
        dfx = msg.sender;
        emit DFXSet(msg.sender, msg.sender);
    }

    function getDFX() external view returns (address) {
        return dfx;
    }

    function setDFX(address _c) external {
        require(msg.sender == dfx, "Curve/must-be-dfx");

        emit DFXSet(msg.sender, _c);

        dfx = _c;
    }
}
