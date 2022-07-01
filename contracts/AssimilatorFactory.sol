pragma solidity ^0.7.3;

import "./assimilators/AssimilatorV2.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAssimilatorFactory.sol";

contract AssimilatorFactory is IAssimilatorFactory,Ownable {
    event NewAssimilator (address indexed caller, bytes32 indexed id, address indexed assimilator);
    event AssimilatorRevoked (address indexed caller, bytes32 indexed id, address indexed assimilator);
    event CurveFactoryUpdated (address indexed caller, address indexed curveFactory);
    mapping(bytes32 => AssimilatorV2) public assimilators;

    address public curveFactory;

    modifier onlyCurveFactory {
        require(msg.sender == curveFactory, "unauthorized");
        _;
    }

    function setCurveFactory (address _curveFactory) external onlyOwner {
        curveFactory = _curveFactory;
        emit CurveFactoryUpdated(msg.sender, curveFactory);
    }
    
    function getAssimilator (address _token) external view override returns (AssimilatorV2) {
        bytes32 assimilatorID = keccak256(abi.encode(_token));
        return assimilators[assimilatorID];
    }

    function newAssimilator (address _oracle, address _token, uint256 _tokenDecimals) external override 
    onlyCurveFactory returns (AssimilatorV2) {
        bytes32 assimilatorID = keccak256(abi.encode(_token));
        if (address(assimilators[assimilatorID]) != address(0)) revert("AssimilatorFactory/currency-pair-already-exists");
        AssimilatorV2 assimilator = new AssimilatorV2(_oracle, _token, _tokenDecimals);
        assimilators[assimilatorID] = assimilator;
        emit NewAssimilator(msg.sender, assimilatorID, address(assimilator));
        return assimilator;
    }

    function revokeAssimilator(address _token) external onlyOwner {
        bytes32 assimilatorID = keccak256(abi.encode(_token));
        address _assimAddress = address(assimilators[assimilatorID]);
        assimilators[assimilatorID] = AssimilatorV2(address(0));
        emit AssimilatorRevoked(msg.sender, assimilatorID, address(_assimAddress));
    }
}