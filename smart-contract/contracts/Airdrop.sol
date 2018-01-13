pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract Airdrop {
    using SafeMath for uint256;

    uint256 public constant INITIAL_ETH_PRICE_USD = 470;
    uint256 public constant MAXIMUM_ETH_PRICE_USD = 2000;
    uint256 public actualPrice;
    uint256 private priceDifference;
    address public whitelistSupplier;
    ERC20 public token;
    mapping (address => bool) public performed;
    address public returnAddress;
    bool public finalized;

    event AirdropPerformed(address indexed _to, uint256 _initialAmount, uint256 _finalAmount, uint256 _actualETHPrice);

    event PriceChanged(uint256 _oldPrice, uint256 _newPrice);

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

    function Airdrop(address _whitelistSupplier, address _token, address _returnAddress) public {
        require(_whitelistSupplier != 0x0);
        require(_token != 0x0);
        require(_returnAddress != 0x0);
        whitelistSupplier = _whitelistSupplier;
        token = ERC20(_token);
        returnAddress = _returnAddress;
        finalized = false;
        actualPrice = INITIAL_ETH_PRICE_USD;
        priceDifference = 0;
    }

    function kill() public onlyReturnAddress() {
        require(finalized);
        selfdestruct(returnAddress);
    }

    function setActualPrice(uint256 _actualPrice) public onlyWhitelistSupplier() {
        if (_actualPrice > INITIAL_ETH_PRICE_USD && _actualPrice < MAXIMUM_ETH_PRICE_USD) {
            priceDifference = _actualPrice.sub(INITIAL_ETH_PRICE_USD);
        } else if (_actualPrice >= MAXIMUM_ETH_PRICE_USD) {
            priceDifference = MAXIMUM_ETH_PRICE_USD.sub(INITIAL_ETH_PRICE_USD);
        } else {
            priceDifference = 0;
        }
        PriceChanged(actualPrice, _actualPrice);
        actualPrice = _actualPrice;
    }

    function performAirdrop(address _to) public onlyWhitelistSupplier() notFinalized() {
        require(priceDifference > 0);
        require(_to != 0x0);
        require(!performed[_to]);
        uint256 initialAmount = token.balanceOf(_to);
        uint256 increase = initialAmount.mul(priceDifference).div(INITIAL_ETH_PRICE_USD);
        performed[_to] = true;
        token.transfer(_to, increase);
        AirdropPerformed(_to, initialAmount, increase.add(initialAmount), actualPrice);
    }

    function finalize() public onlyReturnAddress() notFinalized() {
        finalized = true;
        token.transfer(returnAddress, token.balanceOf(address(this)));
    }
}
