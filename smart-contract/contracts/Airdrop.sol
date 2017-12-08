pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20.sol';

contract Airdrop {
    uint256 constant INITIAL_ETH_PRICE_USD = 470;
    uint256 constant BONUS_PERCENTAGE = 20;
    address whitelistSupplier;
    ERC20 token;
    mapping (address => bool) performed;
    address returnAddress;
    bool finalized;

    event AirdropPerformed(address indexed _to, uint256 _initialAmount, uint256 finalAmount, uint256 _actualETHPrice);

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
        require(_whitelistSupplier == 0x0);
        require(_token == 0x0);
        require(_returnAddress == 0x0);
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
        uint256 actualPrice = _actualPrice;
        if (_actualPrice > INITIAL_ETH_PRICE_USD) {
            priceDifference = _actualPrice - INITIAL_ETH_PRICE_USD;
        } else {
            actualPrice = INITIAL_ETH_PRICE_USD;
        }
        uint256 increase = (initialAmount + priceDifference * actualPrice / INITIAL_ETH_PRICE_USD) * BONUS_PERCENTAGE / 100;
        token.transfer(_to, increase);
        AirdropPerformed(_to, initialAmount, increase + initialAmount, _actualPrice);
    }

    function finalize() onlyReturnAddress() notFinalized() {
        finalized = true;
        token.transfer(returnAddress, token.balanceOf(address(this)));
    }
}