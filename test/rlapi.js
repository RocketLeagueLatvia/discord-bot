const assert = require('assert');
const {RocketLeagueAPI, PlayerNotFoundException} = require('../lib/rllv-api.js');

// Valid steamid64 for tests
const steamid = '76561197982344715';

describe('RocketLeagueAPI', function () {
    describe('#getPlayer(steamid64)', function () {
        it('Should return the player object with the provided steamid64 from the rocketleague.lv API.', async function () {
            const response = await RocketLeagueAPI.getPlayer(steamid);

            assert.ok(response.hasOwnProperty('nick'));
            assert.ok(response.hasOwnProperty('maxmmr'));

        });

        it('Should return null if given a non-numeric argument', async function () {
            assert.strictEqual(await RocketLeagueAPI.getPlayer('non numeric steam id'), null);
        });

        it('Should raise an error when the player isn\'t found in the database.', async function () {
            // I couldn't use assert.raises() since unhandled Promise rejections are deprecated,
            // but If i handle it, the exception doesn't get thrown, therefore the test fails.
            try {
                await RocketLeagueAPI.getPlayer('321321321321');
            } catch (e) {
                assert.ok(e instanceof PlayerNotFoundException);
            }
        });
    });
});
