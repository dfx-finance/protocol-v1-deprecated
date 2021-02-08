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

pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./lib/ABDKMath64x64.sol";

import "./DFXStorage.sol";

import "./CurveMath.sol";

library Orchestrator {
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;

    int128 private constant ONE_WEI = 0x12;

    event ParametersSet(uint256 alpha, uint256 beta, uint256 delta, uint256 epsilon, uint256 lambda);

    event AssetIncluded(address indexed numeraire, address indexed reserve, uint256 weight);

    event AssimilatorIncluded(
        address indexed derivative,
        address indexed numeraire,
        address indexed reserve,
        address assimilator
    );

    function setParams(
        DFXStorage.Curve storage curve,
        uint256 _alpha,
        uint256 _beta,
        uint256 _feeAtHalt,
        uint256 _epsilon,
        uint256 _lambda
    ) external nonReentrant {
        require(0 < _alpha && _alpha < 1e18, "Curve/parameter-invalid-alpha");

        require(_beta < _alpha, "Curve/parameter-invalid-beta");

        require(_feeAtHalt <= 5e17, "Curve/parameter-invalid-max");

        require(_epsilon <= 1e16, "Curve/parameter-invalid-epsilon");

        require(_lambda <= 1e18, "Curve/parameter-invalid-lambda");

        int128 _omega = getFee(curve);

        curve.alpha = (_alpha + 1).divu(1e18);

        curve.beta = (_beta + 1).divu(1e18);

        curve.delta = (_feeAtHalt).divu(1e18).div(uint256(2).fromUInt().mul(curve.alpha.sub(curve.beta))) + ONE_WEI;

        curve.epsilon = (_epsilon + 1).divu(1e18);

        curve.lambda = (_lambda + 1).divu(1e18);

        int128 _psi = getFee(curve);

        require(_omega >= _psi, "Curve/parameters-increase-fee");

        emit ParametersSet(_alpha, _beta, curve.delta.mulu(1e18), _epsilon, _lambda);
    }

    function viewNumeraireBalance(address _token) private view returns (int128) {
        uint256 decimals = ERC20(_token).decimals();
        uint256 balance = ERC20(_token).balanceOf(address(this));

        return balance.divu(10**decimals);
    }

    function getFee(DFXStorage.Curve storage curve) private view returns (int128 fee_) {
        int128 _gLiq;

        // Always pairs
        int128[] memory _bals = new int128[](2);

        address[] memory assets = new address[](2);
        assets[0] = curve.token0;
        assets[1] = curve.token1;

        int128[] memory weights = new int128[](2);
        weights[0] = curve.weight0;
        weights[1] = curve.weight1;

        for (uint256 i = 0; i < _bals.length; i++) {
            int128 _bal = viewNumeraireBalance(assets[i]);

            _bals[i] = _bal;

            _gLiq += _bal;
        }

        fee_ = CurveMath.calculateFee(_gLiq, _bals, curve.beta, curve.delta, weights);
    }

    function safeApprove(
        address _token,
        address _spender,
        uint256 _value
    ) private {
        (bool success, ) =
            // solhint-disable-next-line
            _token.call(abi.encodeWithSignature("approve(address,uint256)", _spender, _value));

        require(success, "SafeERC20: low-level call failed");
    }

    function viewCurve(DFXStorage.Curve storage curve)
        external
        view
        returns (
            uint256 alpha_,
            uint256 beta_,
            uint256 delta_,
            uint256 epsilon_,
            uint256 lambda_
        )
    {
        alpha_ = curve.alpha.mulu(1e18);

        beta_ = curve.beta.mulu(1e18);

        delta_ = curve.delta.mulu(1e18);

        epsilon_ = curve.epsilon.mulu(1e18);

        lambda_ = curve.lambda.mulu(1e18);
    }
}
