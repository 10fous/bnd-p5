const StarNotary = artifacts.require("StarNotary");

const BigNumber = require('bignumber.js');
const truffleAssert = require('truffle-assertions');


contract('StarNotary', async (accs) => {
    let accounts;
    let owner;
    let instance;
    let star1;
    let star2;

    before('setup contract', async () => {
        owner = accs[0];
        star1 = {
            owner: accs[1],
            name: 'First star',
            id: 999
        };
        star2 = {
            owner: accs[2],
            name: 'Seconds star',
            id: 666
        };
        accounts = accs.splice(3, 9);

        instance = await StarNotary.new('Dragon Ball multiverse star token', 'DBMST');
    })

    it('can deploy StarNotary contract with correct metadata', async () => {
        assert.equal(await instance.name.call(), 'Dragon Ball multiverse star token');
        assert.equal(await instance.symbol.call(), 'DBMST');
    });

    it('can create a star', async () => {
        await instance.createStar(star1.name, star1.id, {from: star1.owner});

        const starName = await instance.lookUptokenIdToStarInfo.call(star1.id);
        const starOwner = await instance.ownerOf.call(star1.id);
        
        assert.equal(starName, star1.name);
        assert.equal(starOwner, star1.owner);
    });

    it('can fetch star name', async () => {
        const name = await instance.lookUptokenIdToStarInfo.call(star1.id);

        assert.equal(name, star1.name);
    });
    it('should prevent any user from overwriting an already created star', async () => {
        await truffleAssert.reverts(
            instance.createStar.call(star1.name, star1.id, {from: star1.owner}),
            'Token id already taken'
        );

        // Make sure the state didn't change
        const starName = await instance.lookUptokenIdToStarInfo.call(star1.id);
        const starOwner = await instance.ownerOf.call(star1.id);

        assert.equal(starName, star1.name);
        assert.equal(starOwner, star1.owner);
    });

    it('should not allow a user to put up other user star for sale', async () => {
        let starPrice = web3.utils.toWei(".01", "ether");

        await truffleAssert.reverts(
            instance.putStarUpForSale.call(star1.id, starPrice, {
                from: accounts[1]
            }),
            'UNAUTHORIZED'
        )
        assert.equal(await instance.starsForSale.call(star1.id), 0);
    });

    it('lets a user put up their star for sale', async () => {
        let starPrice = web3.utils.toWei(".01", "ether");

        await instance.putStarUpForSale(star1.id, starPrice, {
            from: star1.owner
        });

        assert.equal(await instance.starsForSale.call(star1.id), starPrice);
    });

    it('lets user buy a star', async () => {
        const buyer = accounts[5];
        const initialBuyerBalance = await web3.eth.getBalance(buyer);

        const starPrice = web3.utils.toWei(".01", "ether");
        const sentValue = web3.utils.toWei(".05", "ether");


        const tx = await instance.buyStar(star1.id, {
            from: buyer,
            value: sentValue
        });
        const newOwner = await instance.ownerOf.call(star1.id);

        assert.equal(newOwner, buyer);
        assert.equal(await instance.starsForSale.call(star1.id), 0);
        // Somehow this doesn 't add up
        // const gasPrice = BigNumber(
        //     web3.utils.toWei(
        //         tx.receipt.gasUsed.toString(),
        //         "gwei"
        //     )
        // ).toNumber();

        // const buyerBalanceAfterTransaction = await web3.eth.getBalance(buyer);
        // const value1 = Number(initialBuyerBalance) - Number(starPrice) - gasPrice;
        // const value2 = Number(buyerBalanceAfterTransaction);

        // assert.equal(value1.isEqualTo(value2), true);
    });

    it('lets a user transfer a star', async() => {
        // This will send back star1 to its original owner.
        await instance.transferStar(star1.owner, star1.id, {from: accounts[5]});
        const newOwner = await instance.ownerOf.call(star1.id);

        assert.equal(newOwner, star1.owner);
    });

    it('prevent a user from transfering a star he doens\'t own', async () => {
        // This will send back star1 to its original owner.
        truffleAssert.reverts(
            instance.transferStar.call(star1.owner, star1.id, {
                from: accounts[5]
            }),
            'UNAUTHORIZED'
        )
    });

    it('lets a user register his star for exchange with another star', async() => {
        await instance.createStar(star2.name, star2.id, {
            from: star2.owner
        });
        const tx = await instance.approveForExchange(star1.id, star2.id, {from: star1.owner});
        
        truffleAssert.eventEmitted(tx, 'starExchangeOffer', (event) => {
            return (BigNumber(event.ownedToken).isEqualTo(star1.id)) && (BigNumber(event.desiredToken).isEqualTo(star2.id))
        })
    });

    it('prevents a user from registering his star for exchange with another non-existant star', async () => {
        await truffleAssert.reverts(
            instance.approveForExchange.call(star1.id, 1111111, {
                from: star1.owner
            }),
            'Desired token not found'
        )
    });

    it('prevents a user from registering a star he doesn\'t own for exchange', async () => {
        await truffleAssert.reverts(
            instance.approveForExchange.call(star1.id, star2.id, {
                from: accounts[4]
            }),
            'UNAUTHORIZED'
        )
    });

    it('prevents a star exchange not approved by both star owners', async () => {
        await truffleAssert.reverts(
            instance.exchangeStars.call(star1.id, star2.id),
            'Exchange not approved by both token owners'
        )
    });

    it('lets a star exchange approved by both star owners', async () => {
        const tx = await instance.approveForExchange(star2.id, star1.id, {
            from: star2.owner
        });

        truffleAssert.eventEmitted(tx, 'starExchangeOffer', (event) => {
            return (BigNumber(event.ownedToken).isEqualTo(star2.id)) && (BigNumber(event.desiredToken).isEqualTo(star1.id))
        });

        const txExchange = await instance.exchangeStars(star1.id, star2.id);

        truffleAssert.eventEmitted(txExchange, 'starExchangeDeal', (event) => {
            return (BigNumber(event.token1).isEqualTo(star1.id)) && (BigNumber(event.token2).isEqualTo(star2.id))
        });
        
        const star1NewOwner = await instance.ownerOf(star1.id);
        const star2NewOwner = await instance.ownerOf(star2.id);

        assert.equal(star1NewOwner, star2.owner, 'Star 1 didn\'t get a new owner!');
        assert.equal(star2NewOwner, star1.owner, 'Star 2 didn\'t get a new owner!');
    });
});