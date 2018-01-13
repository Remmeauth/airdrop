/* global artifacts contract beforeEach it assert: true */

let expectThrow = require('./helpers/expectThrow.js');
let Token = artifacts.require('./Token.sol');
let Airdrop = artifacts.require('./Airdrop.sol');

contract('Airdrop', (accounts) => {
    let token;
    let airdrop;

    beforeEach(async () => {
        token = await Token.new({ from: accounts[0] });
        await accounts.slice(1).forEach(async (account) => {
            await token.transfer(account, 100, { from: accounts[0] });
        });
        airdrop = await Airdrop.new(accounts[0], token.address, accounts[1], { from: accounts[0] });
        await token.transfer(airdrop.address, 10000, { from: accounts[0] });
    });

    it('actual price should be initialized with initial price', async () => {
        let actualPrice = await airdrop.actualPrice.call();
        let initialPrice = await airdrop.INITIAL_ETH_PRICE_USD.call();
        assert.isOk(actualPrice.equals(initialPrice));
    });

    it('only owner can update the actual price', async () => {
        await expectThrow(airdrop.setActualPrice(500, { from: accounts[1] }));
        await expectThrow(airdrop.setActualPrice(500, { from: accounts[2] }));
        await expectThrow(airdrop.setActualPrice(500, { from: accounts[3] }));
        await airdrop.setActualPrice(500, { from: accounts[0] });
        let actualPrice = await airdrop.actualPrice.call();
        assert.isOk(actualPrice.equals(500));
    });

    it('test airdrop correctness without increase (lower than current price)', async () => {
        await airdrop.setActualPrice(400, { from: accounts[0] });
        await expectThrow(airdrop.performAirdrop(accounts[1], { from: accounts[0] }));
    });

    it('test airdrop correctness without increase (equal to current price)', async () => {
        await airdrop.setActualPrice(470, { from: accounts[0] });
        await expectThrow(airdrop.performAirdrop(accounts[2], { from: accounts[0] }));
    });

    it('test airdrop correctness with 1.5 times rate increase', async () => {
        await airdrop.setActualPrice(705, { from: accounts[0] });
        await airdrop.performAirdrop(accounts[3], { from: accounts[0] });
        assert.equal(150, await token.balanceOf.call(accounts[3]));
    });

    it('test airdrop correctness with 2 times rate increase', async () => {
        await airdrop.setActualPrice(940, { from: accounts[0] });
        await airdrop.performAirdrop(accounts[4], { from: accounts[0] });
        assert.equal(200, await token.balanceOf.call(accounts[4]));
    });

    it('test airdrop correctness with increase equal to maximum', async () => {
        await airdrop.setActualPrice(2000, { from: accounts[0] });
        await airdrop.performAirdrop(accounts[5], { from: accounts[0] }); 
        assert.equal(425, await token.balanceOf.call(accounts[5]));
    });

    it('test airdrop correctness with increase more than maximum', async () => {
        await airdrop.setActualPrice(2100, { from: accounts[0] });
        await airdrop.performAirdrop(accounts[6], { from: accounts[0] }); 
        assert.equal(425, await token.balanceOf.call(accounts[6]));
    });

    it('ensure that airdrop cannot be performed twice', async () => {
        await airdrop.setActualPrice(940, { from: accounts[0] });
        await airdrop.performAirdrop(accounts[7], { from: accounts[0] });
        await expectThrow(airdrop.performAirdrop(accounts[7], { from: accounts[0] }));
    });

    it('ensure that only authorized account can perform airdrop', async () => {
        await airdrop.setActualPrice(940, { from: accounts[0] });
        await expectThrow(airdrop.performAirdrop(accounts[8], { from: accounts[1] }));
    });

    it('only authorized account can finalize', async () => {
        await expectThrow(airdrop.finalize({ from: accounts[0] }));
    });

    it('ensure that money are sent after finalization', async () => {
        let initialAmount = await token.balanceOf(accounts[1]);
        let contractAmount = await token.balanceOf(airdrop.address);
        await airdrop.finalize({ from: accounts[1] });
        assert.isOk(initialAmount.plus(contractAmount).equals(await token.balanceOf.call(accounts[1])));
    });

    it('cannot finalize twice', async () => {
        await airdrop.finalize({ from: accounts[1] });
        await expectThrow(airdrop.finalize({ from: accounts[1] }));
    });

    it('cannot send funds after finalization', async () => {
        await airdrop.setActualPrice(940, { from: accounts[0] });        
        await airdrop.finalize({ from: accounts[1] });
        await expectThrow(airdrop.performAirdrop(accounts[9], { from: accounts[0] }));
    });

    it('kill can only be called after finalization', async () => {
        await expectThrow(airdrop.kill({ from: accounts[1] }));
        await airdrop.finalize({ from: accounts[1] });
        airdrop.kill({ from: accounts[1] });
    });

    it('kill can only be called by the authorized account', async () => {
        await airdrop.finalize({ from: accounts[1] });
        await expectThrow(airdrop.kill({ from: accounts[0] }));
        await airdrop.kill({ from: accounts[1] });
    });
});