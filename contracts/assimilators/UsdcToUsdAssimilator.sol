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

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../lib/ABDKMath64x64.sol";
import "../lib/UnsafeMath64x64.sol";
import "../interfaces/IAssimilator.sol";
import "../interfaces/IOracle.sol";
import "../interfaces/ICurveFactory.sol";
import  "hardhat/console.sol";

contract UsdcToUsdAssimilator is IAssimilator {
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;
    using UnsafeMath64x64 for int128;

    IOracle private constant oracle = IOracle(0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6);
    IERC20 private constant usdc = IERC20(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);

    int128 public constant ONE = 0x10000000000000000;

    int128 public epsilon;
    address public factory;

    // solhint-disable-next-line
    constructor() {}

    // solhint-disable-next-line
    function getRate() public view override returns (uint256) {
        return uint256(oracle.latestAnswer());
    }

    function intakeRawAndGetBalance(uint256 _amount) external override returns (int128 amount_, int128 balance_) {
        bool _success = usdc.transferFrom(msg.sender, address(this), _amount);

        require(_success, "Curve/USDC-transfer-from-failed");

        uint256 _balance = usdc.balanceOf(address(this));

        uint256 _rate = getRate();

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    function intakeRaw(uint256 _amount) external override returns (int128 amount_) {
        bool _success = usdc.transferFrom(msg.sender, address(this), _amount);

        require(_success, "Curve/USDC-transfer-from-failed");

        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    function intakeNumeraire(int128 _amount) external override returns (uint256 amount_) {
        uint256 _rate = getRate();

        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;

        bool _success = usdc.transferFrom(msg.sender, address(this), amount_);

        require(_success, "Curve/USDC-transfer-from-failed");
    }

    function intakeNumeraireLPRatio(
        uint256,
        uint256,
        address,
        int128 _amount
    ) external override returns (uint256 amount_) {
        amount_ = _amount.mulu(1e6);

        bool _success = usdc.transferFrom(msg.sender, address(this), amount_);

        require(_success, "Curve/USDC-transfer-from-failed");
    }

    function outputRawAndGetBalance(address _dst, uint256 _amount)
        external
        override
        returns (int128 amount_, int128 balance_)
    {
        uint256 _rate = getRate();

        uint256 _usdcAmount = ((_amount * _rate) / 1e8);

        bool _success = usdc.transfer(_dst, _usdcAmount);

        require(_success, "Curve/USDC-transfer-failed");

        uint256 _balance = usdc.balanceOf(address(this));

        amount_ = _usdcAmount.divu(1e6);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    function outputRaw(address _dst, uint256 _amount) external override returns (int128 amount_) {
        uint256 _rate = getRate();

        uint256 _usdcAmount = (_amount * _rate) / 1e8;

        bool _success = usdc.transfer(_dst, _usdcAmount);

        require(_success, "Curve/USDC-transfer-failed");

        amount_ = _usdcAmount.divu(1e6);
    }

    function outputNumeraire(address _dst, int128 _amount) external override returns (uint256 amount_) {
        
        amount_ = transferFee(_amount);

        bool _success = usdc.transfer(_dst, amount_);

        require(_success, "Curve/USDC-transfer-failed");
    }

    function viewRawAmount(int128 _amount) external view override returns (uint256 amount_) {
        uint256 _rate = getRate();

        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;
    }

    function viewRawAmountLPRatio(
        uint256,
        uint256,
        address,
        int128 _amount
    ) external pure override returns (uint256 amount_) {
        amount_ = _amount.mulu(1e6);
    }

    function viewNumeraireAmount(uint256 _amount) external view override returns (int128 amount_) {
        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);
    }

    function viewNumeraireBalance(address _addr) public view override returns (int128 balance_) {
        uint256 _rate = getRate();

        uint256 _balance = usdc.balanceOf(_addr);

        if (_balance <= 0) return ABDKMath64x64.fromUInt(0);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    // views the numeraire value of the current balance of the reserve wrt to USD
    // since this is already the USD assimlator, the ratio is just 1
    function viewNumeraireBalanceLPRatio(
        uint256,
        uint256,
        address _addr
    ) external view override returns (int128 balance_) {
        uint256 _balance = usdc.balanceOf(_addr);

        return _balance.divu(1e6);
    }

    function viewNumeraireAmountAndBalance(address _addr, uint256 _amount)
        external
        view
        override
        returns (int128 amount_, int128 balance_)
    {
        uint256 _rate = getRate();

        amount_ = ((_amount * _rate) / 1e8).divu(1e6);

        uint256 _balance = usdc.balanceOf(_addr);

        balance_ = ((_balance * _rate) / 1e8).divu(1e6);
    }

    function transferFee (int128 _amount) internal returns(uint256 amount_) {
        console.logString("transfer fee factory");
        console.log(factory);
        int128 protocolFee = ICurveFactory(factory).getProtocolFee();
        address treasury = ICurveFactory(factory).getProtocolTreasury();
        console.logString("transfer fee fee, tre");
        console.logInt(protocolFee);
        console.log(treasury);
        uint256 _rate = getRate();
        int128 _protocolAmount = _amount.us_mul(protocolFee).us_div(100);
        _amount = _amount.us_mul(ONE - epsilon);
        uint256 protocolAmount = (_protocolAmount.mulu(1e6) * 1e8) / _rate;
        amount_ = (_amount.mulu(1e6) * 1e8) / _rate;
        bool success_ = usdc.transfer(treasury, protocolAmount);
        require(success_, "usdc-usdc fee transfer failed");
    }

    function setFactoryAndEpsilon(int128 _epsilon, address _factory) external override{
        console.logString(" usdc assim set factory addr is ");
        console.log(_factory);
        if(epsilon != _epsilon)
            epsilon = _epsilon;
        if(factory != _factory)
            factory = _factory;
    }
}
