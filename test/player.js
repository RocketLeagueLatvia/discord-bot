const assert = require('assert');
const rewire = require('rewire');
const Player = rewire('../lib/player');
const { getClient } = require('./lib/mongo');
const mock = require('./lib/mock');

const getPlayerClient = function () {
    return getClient(Player);
};

const getCollection = function () {
    return getPlayerClient().collection('players');
};

const deletePlayers = function (...ids) {
    return getCollection().deleteMany({ _id: {
        $in: ids
    }});
};

const createPlayer = async function () {
    return await Player.create({
        discordid: '123123',
        discordnick: 'test player',
        steamid64: '1234567890',
        maxmmr: 1000
    });
};

describe('Player', function () {

    describe('#create()', async function () {

        let player;

        it('Should store a new player in the database and return the corresponding Player instance.', async function () {
            player = await createPlayer();
            assert.ok(player.hasOwnProperty('_id'));
            assert.ok(player instanceof Player);
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#findByDiscordId(discordid)', function () {

        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('Should find a player in the database with the provided discord ID, and return a Player instance.', async function () {
            let playerRecord = await Player.findByDiscordId(player.discordid);
            assert.ok(playerRecord instanceof Player);
        });

        it('Should return null if a nonexistent discord id is supplied', async function () {
            assert.strictEqual(await Player.findByDiscordId('NotValid'), null);
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#steamId64Taken(steamid64)', function () {

        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('It should return true if the provided steamid64 is already taken.', async function () {
            assert.ok(await Player.steamId64Taken(player.steamid64));
        });

        it('It should return false if the provided steamid64 is available.', async function () {
            assert.ok(!await Player.steamId64Taken('AvailableValue'));
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#updateMaxMMR()', function () {
        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('It should update the players MaxMMR by utilizing an external resource', function () {
            Player.__with__({
                rllv: mock
            })(function () {
                return player.updateMaxMMR();
            }).then(async function () {
                assert.equal(player.maxmmr, 2000);
                const playerRecord = await getCollection().findOne({ _id: player._id });
                assert.equal(playerRecord.maxmmr, 2000);
            });
        });

        it('It should not raise an exception if a non-existing player is provided', function () {

            let fakePlayer = new Player({
                steamid64: 0,
                maxmmr: 1000
            });

            Player.__with__({
                rllv: mock
            })(function () {
                return fakePlayer.updateMaxMMR();
            }).then(function () {
                assert.equal(fakePlayer.maxmmr, 1000);
            });

        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#unsetSteamId64()', function () {
        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('It should unset the player\'s steamid64', async function () {
            let playerRecord;

            await player.unsetSteamId64();

            playerRecord = await getCollection().findOne({ _id: player._id });
            assert.ok(!player.hasOwnProperty('steamid64'));
            assert.ok(!playerRecord.hasOwnProperty('steamid64'));
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#setParams(params)', function () {
        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('It should set the player\'s parameters both in the database and for the instance.', async function () {
            let playerRecord;

            await player.setParams({
                discordid: '1',
                someprop: 'string'
            });

            playerRecord = await getCollection().findOne({ _id: player._id });
            assert.strictEqual(player.discordid, '1');
            assert.strictEqual(player.someprop, 'string');
            assert.strictEqual(playerRecord.discordid, '1');
            assert.strictEqual(playerRecord.someprop, 'string');
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    describe('#delete()', function () {
        let player;

        before(async function () {
            player = await createPlayer();
        });

        it('It should delete the corresponding player entry from the database.', async function () {
            await player.delete();
            assert.ok(!await getCollection().findOne({ _id: player._id }));
        });

        after(function () {
            deletePlayers(player._id);
        });
    });

    after(function () {
        // Close database connection, so process ends cleanly
        getPlayerClient().client.close();
    });
});
