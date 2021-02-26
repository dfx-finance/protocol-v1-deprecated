// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;

import "./Assimilators.sol";

import "./Storage.sol";

import "./lib/UnsafeMath64x64.sol";
import "./lib/ABDKMath64x64.sol";

import "./CurveMath.sol";

library SelectiveLiquidity {
    using ABDKMath64x64 for int128;
    using UnsafeMath64x64 for int128;

    event Transfer(address indexed from, address indexed to, uint256 value);

    int128 public constant ONE = 0x10000000000000000;

    function selectiveDeposit(
        Storage.Curve storage curve,
        address[] calldata _derivatives,
        uint256[] calldata _amounts,
        uint256 _minShells
    ) external returns (uint256 curves_) {
        (int128 _oGLiq, int128 _nGLiq, int128[] memory _oBals, int128[] memory _nBals) =
            getLiquidityDepositData(curve, _derivatives, _amounts);

        int128 _curves = CurveMath.calculateLiquidityMembrane(curve, _oGLiq, _nGLiq, _oBals, _nBals);

        curves_ = _curves.mulu(1e18);

        require(_minShells < curves_, "Curve/under-minimum-curves");

        mint(curve, msg.sender, curves_);
    }

    function viewSelectiveDeposit(
        Storage.Curve storage curve,
        address[] calldata _derivatives,
        uint256[] calldata _amounts
    ) external view returns (uint256 curves_) {
        (int128 _oGLiq, int128 _nGLiq, int128[] memory _oBals, int128[] memory _nBals) =
            viewLiquidityDepositData(curve, _derivatives, _amounts);

        int128 _curves = CurveMath.calculateLiquidityMembrane(curve, _oGLiq, _nGLiq, _oBals, _nBals);

        curves_ = _curves.mulu(1e18);
    }

    function selectiveWithdraw(
        Storage.Curve storage curve,
        address[] calldata _derivatives,
        uint256[] calldata _amounts,
        uint256 _maxShells
    ) external returns (uint256 curves_) {
        (int128 _oGLiq, int128 _nGLiq, int128[] memory _oBals, int128[] memory _nBals) =
            getLiquidityWithdrawData(curve, _derivatives, msg.sender, _amounts);

        int128 _curves = CurveMath.calculateLiquidityMembrane(curve, _oGLiq, _nGLiq, _oBals, _nBals);

        _curves = _curves.neg().us_mul(ONE + curve.epsilon);

        curves_ = _curves.mulu(1e18);

        require(curves_ < _maxShells, "Curve/above-maximum-curves");

        burn(curve, msg.sender, curves_);
    }

    function viewSelectiveWithdraw(
        Storage.Curve storage curve,
        address[] calldata _derivatives,
        uint256[] calldata _amounts
    ) external view returns (uint256 curves_) {
        (int128 _oGLiq, int128 _nGLiq, int128[] memory _oBals, int128[] memory _nBals) =
            viewLiquidityWithdrawData(curve, _derivatives, _amounts);

        int128 _curves = CurveMath.calculateLiquidityMembrane(curve, _oGLiq, _nGLiq, _oBals, _nBals);

        _curves = _curves.neg().us_mul(ONE + curve.epsilon);

        curves_ = _curves.mulu(1e18);
    }

    function getLiquidityDepositData(
        Storage.Curve storage curve,
        address[] memory _derivatives,
        uint256[] memory _amounts
    )
        private
        returns (
            int128 oGLiq_,
            int128 nGLiq_,
            int128[] memory,
            int128[] memory
        )
    {
        uint256 _length = curve.weights.length;
        int128[] memory oBals_ = new int128[](_length);
        int128[] memory nBals_ = new int128[](_length);

        for (uint256 i = 0; i < _derivatives.length; i++) {
            Storage.Assimilator memory _assim = curve.assimilators[_derivatives[i]];

            require(_assim.addr != address(0), "Curve/unsupported-derivative");

            if (nBals_[_assim.ix] == 0 && 0 == oBals_[_assim.ix]) {
                (int128 _amount, int128 _balance) = Assimilators.intakeRawAndGetBalance(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = _balance;

                oBals_[_assim.ix] = _balance.sub(_amount);
            } else {
                int128 _amount = Assimilators.intakeRaw(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = nBals_[_assim.ix].add(_amount);
            }
        }

        return completeLiquidityData(curve, oBals_, nBals_);
    }

    function getLiquidityWithdrawData(
        Storage.Curve storage curve,
        address[] memory _derivatives,
        address _rcpnt,
        uint256[] memory _amounts
    )
        private
        returns (
            int128 oGLiq_,
            int128 nGLiq_,
            int128[] memory,
            int128[] memory
        )
    {
        uint256 _length = curve.weights.length;
        int128[] memory oBals_ = new int128[](_length);
        int128[] memory nBals_ = new int128[](_length);

        for (uint256 i = 0; i < _derivatives.length; i++) {
            Storage.Assimilator memory _assim = curve.assimilators[_derivatives[i]];

            require(_assim.addr != address(0), "Curve/unsupported-derivative");

            if (nBals_[_assim.ix] == 0 && 0 == oBals_[_assim.ix]) {
                (int128 _amount, int128 _balance) =
                    Assimilators.outputRawAndGetBalance(_assim.addr, _rcpnt, _amounts[i]);

                nBals_[_assim.ix] = _balance;
                oBals_[_assim.ix] = _balance.sub(_amount);
            } else {
                int128 _amount = Assimilators.outputRaw(_assim.addr, _rcpnt, _amounts[i]);

                nBals_[_assim.ix] = nBals_[_assim.ix].add(_amount);
            }
        }

        return completeLiquidityData(curve, oBals_, nBals_);
    }

    function viewLiquidityDepositData(
        Storage.Curve storage curve,
        address[] memory _derivatives,
        uint256[] memory _amounts
    )
        private
        view
        returns (
            int128 oGLiq_,
            int128 nGLiq_,
            int128[] memory,
            int128[] memory
        )
    {
        uint256 _length = curve.assets.length;
        int128[] memory oBals_ = new int128[](_length);
        int128[] memory nBals_ = new int128[](_length);

        for (uint256 i = 0; i < _derivatives.length; i++) {
            Storage.Assimilator memory _assim = curve.assimilators[_derivatives[i]];

            require(_assim.addr != address(0), "Curve/unsupported-derivative");

            if (nBals_[_assim.ix] == 0 && 0 == oBals_[_assim.ix]) {
                (int128 _amount, int128 _balance) =
                    Assimilators.viewNumeraireAmountAndBalance(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = _balance.add(_amount);

                oBals_[_assim.ix] = _balance;
            } else {
                int128 _amount = Assimilators.viewNumeraireAmount(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = nBals_[_assim.ix].add(_amount);
            }
        }

        return completeLiquidityData(curve, oBals_, nBals_);
    }

    function viewLiquidityWithdrawData(
        Storage.Curve storage curve,
        address[] memory _derivatives,
        uint256[] memory _amounts
    )
        private
        view
        returns (
            int128 oGLiq_,
            int128 nGLiq_,
            int128[] memory,
            int128[] memory
        )
    {
        uint256 _length = curve.assets.length;
        int128[] memory oBals_ = new int128[](_length);
        int128[] memory nBals_ = new int128[](_length);

        for (uint256 i = 0; i < _derivatives.length; i++) {
            Storage.Assimilator memory _assim = curve.assimilators[_derivatives[i]];

            require(_assim.addr != address(0), "Curve/unsupported-derivative");

            if (nBals_[_assim.ix] == 0 && 0 == oBals_[_assim.ix]) {
                (int128 _amount, int128 _balance) =
                    Assimilators.viewNumeraireAmountAndBalance(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = _balance.sub(_amount);

                oBals_[_assim.ix] = _balance;
            } else {
                int128 _amount = Assimilators.viewNumeraireAmount(_assim.addr, _amounts[i]);

                nBals_[_assim.ix] = nBals_[_assim.ix].sub(_amount);
            }
        }

        return completeLiquidityData(curve, oBals_, nBals_);
    }

    function completeLiquidityData(
        Storage.Curve storage curve,
        int128[] memory oBals_,
        int128[] memory nBals_
    )
        private
        view
        returns (
            int128 oGLiq_,
            int128 nGLiq_,
            int128[] memory,
            int128[] memory
        )
    {
        uint256 _length = oBals_.length;

        for (uint256 i = 0; i < _length; i++) {
            if (oBals_[i] == 0 && 0 == nBals_[i]) {
                nBals_[i] = oBals_[i] = Assimilators.viewNumeraireBalance(curve.assets[i].addr);
            }

            oGLiq_ += oBals_[i];
            nGLiq_ += nBals_[i];
        }

        return (oGLiq_, nGLiq_, oBals_, nBals_);
    }

    function burn(
        Storage.Curve storage curve,
        address account,
        uint256 amount
    ) private {
        curve.balances[account] = burnSub(curve.balances[account], amount);

        curve.totalSupply = burnSub(curve.totalSupply, amount);

        emit Transfer(msg.sender, address(0), amount);
    }

    function mint(
        Storage.Curve storage curve,
        address account,
        uint256 amount
    ) private {
        curve.totalSupply = mintAdd(curve.totalSupply, amount);

        curve.balances[account] = mintAdd(curve.balances[account], amount);

        emit Transfer(address(0), msg.sender, amount);
    }

    function mintAdd(uint256 x, uint256 y) private pure returns (uint256 z) {
        require((z = x + y) >= x, "Curve/mint-overflow");
    }

    function burnSub(uint256 x, uint256 y) private pure returns (uint256 z) {
        require((z = x - y) <= x, "Curve/burn-underflow");
    }
}
