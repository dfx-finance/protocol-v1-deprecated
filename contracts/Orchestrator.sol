// SPDX-License-Identifier: MIT

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./lib/ABDKMath64x64.sol";

import "./DFXStorage.sol";

import "./CurveMath.sol";

library Orchestrator {
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;

    int128 constant ONE_WEI = 0x12;

    event ParametersSet(uint256 alpha, uint256 beta, uint256 delta, uint256 epsilon, uint256 lambda);

    event AssetIncluded(address indexed numeraire, address indexed reserve, uint weight);

    event AssimilatorIncluded(address indexed derivative, address indexed numeraire, address indexed reserve, address assimilator);

    function setParams (
        DFXStorage.Curve storage curve,
        uint256 _alpha,
        uint256 _beta,
        uint256 _feeAtHalt,
        uint256 _epsilon,
        uint256 _lambda
    ) external {

        require(0 < _alpha && _alpha < 1e18, "Curve/parameter-invalid-alpha");

        require(0 <= _beta && _beta < _alpha, "Curve/parameter-invalid-beta");

        require(_feeAtHalt <= .5e18, "Curve/parameter-invalid-max");

        require(0 <= _epsilon && _epsilon <= .01e18, "Curve/parameter-invalid-epsilon");

        require(0 <= _lambda && _lambda <= 1e18, "Curve/parameter-invalid-lambda");

        int128 _omega = getFee(curve);

        curve.alpha = (_alpha + 1).divu(1e18);

        curve.beta = (_beta + 1).divu(1e18);

        curve.delta = ( _feeAtHalt ).divu(1e18).div(uint(2).fromUInt().mul(curve.alpha.sub(curve.beta))) + ONE_WEI;

        curve.epsilon = (_epsilon + 1).divu(1e18);

        curve.lambda = (_lambda + 1).divu(1e18);
        
        int128 _psi = getFee(curve);
        
        require(_omega >= _psi, "Curve/parameters-increase-fee");

        emit ParametersSet(_alpha, _beta, curve.delta.mulu(1e18), _epsilon, _lambda);

    }

    function viewNumeraireBalance (
        address _token
    ) private view returns (int128) {
        uint256 decimals = ERC20(_token).decimals();
        uint256 balance = ERC20(_token).balanceOf(address(this));

        return balance.divu(10**decimals);
    }

    function getFee (
        DFXStorage.Curve storage curve
    ) private view returns (
        int128 fee_
    ) {

        int128 _gLiq;

        // Always paits
        int128[] memory _bals = new int128[](2);

        address[] memory assets = new address[](2);
        assets[0] = curve.token0;
        assets[1] = curve.token1;

        int128[] memory weights = new int128[](2);
        weights[0] = curve.weight0;
        weights[1] = curve.weight1;

        for (uint i = 0; i < _bals.length; i++) {

            int128 _bal = viewNumeraireBalance(assets[i]);

            _bals[i] = _bal;

            _gLiq += _bal;

        }

        fee_ = CurveMath.calculateFee(_gLiq, _bals, curve.beta, curve.delta, weights);
    }

}