const { PlayerNotFoundException } = require('../../lib/rllv-api.js');

class RocketLeagueAPI {
    static async getPlayer(steamid64) {
        // If steamid64 is 1, return valid response
        // If 0, raise exception
        if (steamid64) {
            return {
                'nick':'mockplayer',
                'maxmmr':'2000'
            };
        } else {
            throw new PlayerNotFoundException('Exception raised from mock RocketLeagueAPI');
        }
    }
}

module.exports = {RocketLeagueAPI};
