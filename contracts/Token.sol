// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.6.11;


// This is the main building block for smart contracts.
contract Token {
    // Some string type variables to identify the token.
    // The `public` modifier makes a variable readable from outside the contract.
    string constant public name = "My Hardhat Token";
    string constant public symbol = "MBT";

    // The fixed amount of tokens stored in an unsigned integer type variable.
    uint256 constant public TOTAL_SUPPLY = 100;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account balance.
    mapping(address => uint256) balances;

    /**
     * Contract initialization.
     *
     * The `constructor` is executed only once when the contract is created.
     */
    constructor() public {
        // The TOTAL_SUPPLY is assigned to transaction sender, which is the account
        // that is deploying the contract.
        balances[msg.sender] = TOTAL_SUPPLY;
        owner = msg.sender;
    }

    /**
     * Read only function to retrieve the token balance of a given account.
     *
     * The `view` modifier indicates that it doesn't modify the contract's
     * state, which allows us to call it without executing a transaction.
     */
    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}