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

    it('test airdrop correctness without increase (bonus only)', async () => {
        await airdrop.performAirdrop(accounts[1], 470, { from: accounts[0] });
        assert.equal(120, await token.balanceOf.call(accounts[1]));
    });

    it('test airdrop correctness without increase (bonus + 1.5 times rate increase)', async () => {
        await airdrop.performAirdrop(accounts[2], 705, { from: accounts[0] });
        assert.equal(180, await token.balanceOf.call(accounts[2]));
    });

    it('test airdrop correctness without increase (bonus + 2 times rate increase)', async () => {
        await airdrop.performAirdrop(accounts[3], 940, { from: accounts[0] });
        assert.equal(240, await token.balanceOf.call(accounts[3]));
    });

    it('ensure that airdrop cannot be performed twice', async () => {
        await airdrop.performAirdrop(accounts[4], 940, { from: accounts[0] });
        await expectThrow(airdrop.performAirdrop(accounts[4], 940, { from: accounts[0] }));
    });

    it('ensure that only authorized account can perform airdrop', async () => {
        await expectThrow(airdrop.performAirdrop(accounts[5], 940, { from: accounts[1] }));
    });

    it('test airdrop correctness with dropped rate (bonus only)', async () => {
        await airdrop.performAirdrop(accounts[6], 200, { from: accounts[0] });
        assert.equal(120, await token.balanceOf.call(accounts[6]));
    });

    it('only authorized account can finalize', async () => {
        await expectThrow(airdrop.finalize({ from: accounts[0] }));
    });

    it('ensure that money are sent', async () => {
        let initialAmount = await token.balanceOf(accounts[1]);
        let contractAmount = await token.balanceOf(airdrop.address);
        await airdrop.finalize({ from: accounts[1] });
        assert.isOk(initialAmount.plus(contractAmount).equals(await token.balanceOf.call(accounts[1])));
    });

    it('cannot finalize twice', async () => {
        await airdrop.finalize({ from: accounts[1] });
        await expectThrow(airdrop.finalize({ from: accounts[1] }))
    });

    it('cannot send funds after finalization', async () => {
        await airdrop.finalize({ from: accounts[1] });
        await expectThrow(airdrop.performAirdrop(accounts[7], 200, { from: accounts[0] }));
    });

    it('try rate more than maximum', async () => {
        await airdrop.performAirdrop(accounts[8], 2100, { from: accounts[0] }); 
        assert.equal(510, await token.balanceOf.call(accounts[8]));
    });
});