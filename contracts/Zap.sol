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
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

import "./Curve.sol";

contract Zap {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public constant USDC = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    struct ZapData {
        address curve;
        address base;
        uint256 zapAmount;
        uint256 curveBaseBal;
        uint8 curveBaseDecimals;
        uint256 curveQuoteBal;
    }

    function zapFromBase(
        address _curve,
        uint256 _zapAmount,
        uint256 _deadline,
        uint256 _minLPAmount
    ) public returns (uint256) {
        (address base, uint256 swapAmount) = calcSwapAmountForZapFromBase(_curve, _zapAmount);

        // Get base token
        IERC20(base).safeTransferFrom(msg.sender, address(this), _zapAmount);
        IERC20(base).safeApprove(_curve, 0);
        IERC20(base).safeApprove(_curve, swapAmount);

        // Swap on curve
        Curve(_curve).originSwap(base, address(USDC), swapAmount, 0, _deadline);

        // Calculate deposit amount
        (uint256 depositAmount, uint256 baseAmount, uint256 quoteAmount) = _calcDepositAmount(_curve, base);

        // Can only deposit the smaller amount as we won't have enough of the
        // token to deposit
        IERC20(base).safeApprove(_curve, 0);
        IERC20(base).safeApprove(_curve, baseAmount);

        USDC.safeApprove(_curve, 0);
        USDC.safeApprove(_curve, quoteAmount);

        (uint256 lpAmount, ) = Curve(_curve).deposit(depositAmount, _deadline);
        require(lpAmount >= _minLPAmount, "!Zap/not-enough-lp-amount");

        // Transfer all remaining balances back to user
        IERC20(_curve).transfer(msg.sender, IERC20(_curve).balanceOf(address(this)));
        IERC20(base).transfer(msg.sender, IERC20(base).balanceOf(address(this)));
        USDC.transfer(msg.sender, USDC.balanceOf(address(this)));
    }

    // Base will always be index 0
    function calcSwapAmountForZapFromBase(address _curve, uint256 _zapAmount) public view returns (address, uint256) {
        address base = Curve(_curve).reserves(0);

        // Ratio of base quote in 18 decimals
        uint256 curveBaseBal = IERC20(base).balanceOf(_curve);
        uint8 curveBaseDecimals = ERC20(base).decimals();
        uint256 curveQuoteBal = USDC.balanceOf(_curve);
        uint256 curveRatio = curveBaseBal.mul(10**(36 - uint256(curveBaseDecimals))).div(curveQuoteBal.mul(1e12));

        // How much user wants to swap
        uint256 initialSwapAmount =
            _zapAmount.sub(
                curveRatio <= 1e18 ? _zapAmount.mul(curveRatio).div(1e18) : _zapAmount.mul(1e18).div(curveRatio)
            );

        return (
            base,
            _calcBaseSwapAmount(
                initialSwapAmount,
                ZapData({
                    curve: _curve,
                    base: base,
                    zapAmount: _zapAmount,
                    curveBaseBal: curveBaseBal,
                    curveBaseDecimals: curveBaseDecimals,
                    curveQuoteBal: curveQuoteBal
                })
            )
        );
    }

    // **** Internal function ****

    function _calcBaseSwapAmount(uint256 initialSwapAmount, ZapData memory zapData) internal view returns (uint256) {
        uint256 swapAmount = initialSwapAmount;
        uint256 delta = swapAmount.div(2);
        uint256 recvAmount;
        uint256 curveRatio;
        uint256 userRatio;

        // Computer bring me magic number
        for (uint256 i = 0; i < 32; i++) {
            // How much will we receive in return
            recvAmount = Curve(zapData.curve).viewOriginSwap(zapData.base, address(USDC), swapAmount);

            // Update user's ratio
            userRatio = zapData.zapAmount.sub(swapAmount).mul(10**(36 - uint256(zapData.curveBaseDecimals))).div(
                recvAmount.mul(1e12)
            );
            curveRatio = zapData.curveBaseBal.add(swapAmount).mul(10**(36 - uint256(zapData.curveBaseDecimals))).div(
                zapData.curveQuoteBal.sub(recvAmount).mul(1e12)
            );

            // If user's ratio is approx curve ratio, (up to 3 decimal places) then just swap
            // I.e. ratio converges
            if (userRatio.div(1e15) == curveRatio.div(1e15)) {
                return swapAmount;
            }
            // Otherwise, we keep iterating
            else if (userRatio > curveRatio) {
                // We swapping too little
                swapAmount = swapAmount.add(delta);
            } else if (userRatio < curveRatio) {
                // We swapping too much
                swapAmount = swapAmount.sub(delta);
            }

            // Keep halving
            delta = delta.div(2);
        }

        return swapAmount;
    }

    function _calcDepositAmount(address _curve, address _base)
        internal
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        // Calculate _depositAmount
        uint8 curveBaseDecimals = ERC20(_base).decimals();
        uint256 curveRatio =
            IERC20(_base).balanceOf(_curve).mul(10**(36 - uint256(curveBaseDecimals))).div(
                USDC.balanceOf(_curve).mul(1e12)
            );

        // Deposit amount is denomiated in USD value (based on pool LP ratio)
        // Things are 1:1 on USDC side on deposit
        uint256 usdcAmount = USDC.balanceOf(address(this));
        uint256 usdcDepositAmount = usdcAmount.mul(1e12);

        // Things will be based on ratio on deposit
        uint256 baseAmount = IERC20(_base).balanceOf(address(this));
        uint256 baseDepositAmount = baseAmount.mul(10**(18 - uint256(curveBaseDecimals)));

        // Trim out decimal values
        uint256 depositAmount = usdcDepositAmount.add(baseDepositAmount.mul(1e18).div(curveRatio));

        // // Make sure we have enough of our inputs
        (, uint256[] memory outs) = Curve(_curve).viewDeposit(1e18);

        (, outs) = Curve(_curve).viewDeposit(depositAmount);

        uint256 baseDelta = outs[0] > baseAmount ? outs[0].sub(baseAmount) : 0;
        uint256 usdcDelta = outs[1] > usdcAmount ? outs[1].sub(usdcAmount) : 0;
        uint256 ratio;

        // Make sure we can deposit
        if (baseDelta > 0) {
            ratio = baseDelta.mul(10**curveBaseDecimals).div(baseAmount);
            depositAmount = depositAmount.sub(depositAmount.mul(ratio).div(10**curveBaseDecimals));
        }

        if (usdcDelta > 0) {
            ratio = usdcDelta.mul(1e6).div(usdcAmount);
            depositAmount = depositAmount.sub(depositAmount.mul(ratio).div(1e6));
        }

        return (depositAmount, baseAmount, usdcAmount);
    }
}
