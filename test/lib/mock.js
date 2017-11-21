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


class Message {
    async say(msg) {
        return msg;
    }
}


class Collection {
    has() {
        return true;
    } 

    get() {}
}


class Client {
    constructor(options) {
        this.registry = {
            types: new Collection()
        };
    }
}

module.exports = {RocketLeagueAPI, Client, Message};
