const rewire = require('rewire');
const Player = rewire('../lib/player');
const { getClient } = require('./lib/mongo');

const getPlayerClient = function () {
    return getClient(Player);
};

describe('Player', function () {

    describe('#create()', function () {
        it('Should store a new player in the database and return the corresponding Player instance.');
    });

    describe('#findByDiscordId(discordid)', function () {
        it('It should find a player in the database with the provided discord ID, and return a Player instance.');
    });

    describe('#steamId64Taken(steamid64)', function () {
        it('It should return if the provided steamid64 is already taken.');
    });

    describe('#updateMaxMMR()', function () {
        it('It should update the players MaxMMR by utilizing an external resource');
    });

    describe('#unsetSteamId64()', function () {
        it('It should unset the player\'s steamid64');
    });

    describe('#setParams(params)', function () {
        it('It should set the player\'s parameters both in the database and for the instance.');
    });

    describe('#delete()', function () {
        it('It should delete the corresponding player entry from the database.');
    });

    after(function () {
        // Close database connection, so process ends cleanly
        getPlayerClient().client.close();
    });
});
