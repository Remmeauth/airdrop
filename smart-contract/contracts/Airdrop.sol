pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/token/ERC20.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract Airdrop {
    using SafeMath for uint256;

    uint256 constant INITIAL_ETH_PRICE_USD = 470;
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

    function Airdrop(address _whitelistSupplier, address _token, address _returnAddress) public {
        require(_whitelistSupplier != 0x0);
        require(_token != 0x0);
        require(_returnAddress != 0x0);
        whitelistSupplier = _whitelistSupplier;
        token = ERC20(_token);
        returnAddress = _returnAddress;
        finalized = false;
    }

    function kill() public onlyReturnAddress() {
        require(finalized);
        selfdestruct(returnAddress);
    }

    function performAirdrop(address _to, uint256 _actualPrice) public onlyWhitelistSupplier() notFinalized() {
        require(_to != 0x0);
        require (!performed[_to]);
        uint256 initialAmount = token.balanceOf(_to);
        uint256 priceDifference = 0;
        if (_actualPrice > INITIAL_ETH_PRICE_USD && _actualPrice < MAXIMUM_ETH_PRICE_USD) {
            priceDifference = _actualPrice.sub(INITIAL_ETH_PRICE_USD);
        } else if (_actualPrice >= MAXIMUM_ETH_PRICE_USD) {
            priceDifference = MAXIMUM_ETH_PRICE_USD.sub(INITIAL_ETH_PRICE_USD);
        } else {
            priceDifference = 0;
        }
        uint256 increase = initialAmount.mul(priceDifference).div(INITIAL_ETH_PRICE_USD);
        performed[_to] = true;
        token.transfer(_to, increase);
        AirdropPerformed(_to, initialAmount, increase.add(initialAmount), _actualPrice);
    }

    function finalize() public onlyReturnAddress() notFinalized() {
        finalized = true;
        token.transfer(returnAddress, token.balanceOf(address(this)));
    }
}
