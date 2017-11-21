const oneLine = require('common-tags').oneLine;
const assert = require('assert');
const {TournamentListEmbed} = require('../lib/player-list-embed');

describe('TournamentListEmbed', function () {
    describe('#getEmbed()', function () {
        it(oneLine`
            Should accept an array of players
            and return an embed object where
            the players are displayed as a table.`,
            function () {
                let players = [
                    {discordnick: 'first', maxmmr: 1},
                    {discordnick: 'second', maxmmr: 2},
                    {discordnick: 'third', maxmmr: 3},
                ]; 

                let embedFields = new TournamentListEmbed('Some title', players).getEmbed().fields;
                let playerMMR = [];
                let playerNames = [];

                players.forEach(player => {
                    playerNames.push(player.discordnick);
                    playerMMR.push(player.maxmmr);
                });

                assert.strictEqual(embedFields[0].value, playerNames.join('\n'));
                assert.strictEqual(embedFields[1].value, playerMMR.join('\n'));
            });
    });
});
