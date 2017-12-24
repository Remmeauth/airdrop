pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';

contract Token is StandardToken {
    uint256 constant INITIAL_BALANCE = 1000000000;
    function Token() public {
        balances[msg.sender] = INITIAL_BALANCE;
    }
}