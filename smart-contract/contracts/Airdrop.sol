pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20.sol';

contract Airdrop {
    uint256 constant INITIAL_ETH_PRICE_USD = 470;
    uint256 constant BONUS_PERCENTAGE = 20;
    uint256 constant MAXIMUM_ETH_PRICE_USD = 2000;
    address whitelistSupplier;
    ERC20 token;
    mapping (address => bool) performed;
    address returnAddress;
    bool finalized;

    event AirdropPerformed(address indexed _to, uint256 _initialAmount, uint256 _finalAmount, uint256 _actualETHPrice);

    modifier onlyWhitelistSupplier() {
        require(msg.sender == whitelistSupplier);
        _;
    }

    modifier onlyReturnAddress() {
        require(msg.sender == returnAddress);
        _;
    }

    modifier notFinalized() {
        require(!finalized);
        _;
    }

    function Airdrop(address _whitelistSupplier, address _token, address _returnAddress) {
        require(_whitelistSupplier != 0x0);
        require(_token != 0x0);
        require(_returnAddress != 0x0);
        whitelistSupplier = _whitelistSupplier;
        token = ERC20(_token);
        returnAddress = _returnAddress;
        finalized = false;
    }

    function performAirdrop(address _to, uint256 _actualPrice) onlyWhitelistSupplier() notFinalized() {
        require(_to != 0x0);
        require (!performed[_to]);
        uint256 initialAmount = token.balanceOf(_to);
        uint256 priceDifference = 0;
        if (_actualPrice > INITIAL_ETH_PRICE_USD && _actualPrice < MAXIMUM_ETH_PRICE_USD) {
            priceDifference = _actualPrice - INITIAL_ETH_PRICE_USD;
        } else if (_actualPrice >= MAXIMUM_ETH_PRICE_USD) {
            priceDifference = MAXIMUM_ETH_PRICE_USD - INITIAL_ETH_PRICE_USD;
        } else {
            priceDifference = 0;
        }
        uint256 airdropIncrease = initialAmount * priceDifference / INITIAL_ETH_PRICE_USD;
        uint256 bonusToInitial = initialAmount * BONUS_PERCENTAGE / 100;
        uint256 bonusToAirdrop = airdropIncrease * BONUS_PERCENTAGE / 100;
        uint256 increase = airdropIncrease + bonusToInitial + bonusToAirdrop;
        performed[_to] = true;
        token.transfer(_to, increase);
        AirdropPerformed(_to, initialAmount, increase + initialAmount, _actualPrice);
    }

    function finalize() onlyReturnAddress() notFinalized() {
        finalized = true;
        token.transfer(returnAddress, token.balanceOf(address(this)));
    }
}