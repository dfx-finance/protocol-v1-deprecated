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

import "./Assimilators.sol";

contract DFXStorage {
    struct Curve {
        // Curve parameters
        int128 alpha;
        int128 beta;
        int128 delta;
        int128 epsilon;
        int128 lambda;
        int128[] weights;
        // Assets and their assimilators
        Assimilator[] assets;
        mapping(address => Assimilator) assimilators;
        // ERC20 Interface
        uint256 totalSupply;
        mapping(address => uint256) balances;
        mapping(address => mapping(address => uint256)) allowances;
    }

    struct Assimilator {
        address addr;
        uint8 ix;
    }

    // Curve parameters
    Curve public curve;

    // Ownable
    address public owner;

    // Logic
    mapping(address => PartitionTicket) public partitionTickets;

    struct PartitionTicket {
        uint256[] claims;
        bool initialized;
    }

    address[] public derivatives;
    address[] public numeraires;
    address[] public reserves;

    // Curve operational state
    bool public partitioned = false;
    bool public frozen = false;
    bool internal notEntered = true;
}
