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

contract DFXStorage {
    struct Curve {
        int128 alpha;
        int128 beta;
        int128 delta;
        int128 epsilon;
        int128 lambda;
        int128 weight0;
        int128 weight1;
        address token0;
        address token1;
    }

    // Curve parameters
    Curve public curve;

    // Ownable
    address public owner;

    // ERC20
    uint256 public totalSupply;
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    // Frozen
    bool public paused = false;
}
