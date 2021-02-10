// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;

import "./Assimilators.sol";

import "./DFXStorage.sol";

import "./lib/ABDKMath64x64.sol";
import "./lib/UnsafeMath64x64.sol";

library PartitionedLiquidity {
    using ABDKMath64x64 for uint256;
    using ABDKMath64x64 for int128;
    using UnsafeMath64x64 for int128;

    event PoolPartitioned(bool);

    event PartitionRedeemed(address indexed token, address indexed redeemer, uint256 value);

    int128 public constant ONE = 0x10000000000000000;

    function partition(
        DFXStorage.Curve storage curve,
        mapping(address => DFXStorage.PartitionTicket) storage partitionTickets
    ) external {
        uint256 _length = curve.assets.length;

        DFXStorage.PartitionTicket storage totalSupplyTicket = partitionTickets[address(this)];

        totalSupplyTicket.initialized = true;

        for (uint256 i = 0; i < _length; i++) totalSupplyTicket.claims.push(curve.totalSupply);

        emit PoolPartitioned(true);
    }

    function viewPartitionClaims(
        DFXStorage.Curve storage curve,
        mapping(address => DFXStorage.PartitionTicket) storage partitionTickets,
        address _addr
    ) external view returns (uint256[] memory claims_) {
        DFXStorage.PartitionTicket storage ticket = partitionTickets[_addr];

        if (ticket.initialized) return ticket.claims;

        uint256 _length = curve.assets.length;
        claims_ = new uint256[](_length);
        uint256 _balance = curve.balances[msg.sender];

        for (uint256 i = 0; i < _length; i++) claims_[i] = _balance;

        return claims_;
    }

    function partitionedWithdraw(
        DFXStorage.Curve storage curve,
        mapping(address => DFXStorage.PartitionTicket) storage partitionTickets,
        address[] calldata _derivatives,
        uint256[] calldata _withdrawals
    ) external returns (uint256[] memory) {
        uint256 _length = curve.assets.length;
        uint256 _balance = curve.balances[msg.sender];

        DFXStorage.PartitionTicket storage totalSuppliesTicket = partitionTickets[address(this)];
        DFXStorage.PartitionTicket storage ticket = partitionTickets[msg.sender];

        if (!ticket.initialized) {
            for (uint256 i = 0; i < _length; i++) ticket.claims.push(_balance);
            ticket.initialized = true;
        }

        _length = _derivatives.length;

        uint256[] memory withdrawals_ = new uint256[](_length);

        for (uint256 i = 0; i < _length; i++) {
            DFXStorage.Assimilator memory _assim = curve.assimilators[_derivatives[i]];

            require(totalSuppliesTicket.claims[_assim.ix] >= _withdrawals[i], "Shell/burn-exceeds-total-supply");

            require(ticket.claims[_assim.ix] >= _withdrawals[i], "Shell/insufficient-balance");

            require(_assim.addr != address(0), "Shell/unsupported-asset");

            int128 _reserveBalance = Assimilators.viewNumeraireBalance(_assim.addr);

            int128 _multiplier = _withdrawals[i].divu(1e18).div(totalSuppliesTicket.claims[_assim.ix].divu(1e18));

            totalSuppliesTicket.claims[_assim.ix] = totalSuppliesTicket.claims[_assim.ix] - _withdrawals[i];

            ticket.claims[_assim.ix] = ticket.claims[_assim.ix] - _withdrawals[i];

            uint256 _withdrawal =
                Assimilators.outputNumeraire(_assim.addr, msg.sender, _reserveBalance.mul(_multiplier));

            withdrawals_[i] = _withdrawal;

            emit PartitionRedeemed(_derivatives[i], msg.sender, withdrawals_[i]);
        }

        return withdrawals_;
    }
}
