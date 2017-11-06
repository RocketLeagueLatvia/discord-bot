const mongodb = require('./mongodb');
const rllv = require('./rllv-api');

class Player {
    constructor({_id, discordid, discordnick, steamid64, maxmmr}) {
        this._id = _id;
        this.discordid = discordid;
        this.discordnick = discordnick;
        this.steamid64 = steamid64;
        this.maxmmr = maxmmr;
    }

    static async create({discordid, discordnick, steamid64}) {

        const player = new Player({discordid, discordnick, steamid64});

        await mongodb.collection('players').insert(player);

        return player;
    }

    static async findByDiscordId(discordid) {
        const data = await mongodb.collection('players').findOne({discordid: discordid});

        if (!data) return null;

        return new Player(data);
    }

    async getMaxMMR() {
        let response;

        if (!this.steamid64) return null;

        try {
            response = await rllv.RocketLeagueAPI.getPlayer(this.steamid64);
        } catch (e) {
            if (e instanceof rllv.PlayerNotFoundException) return null;
            throw e;
        }

        this.maxmmr = response.maxmmr;
        await mongodb.collection('players').updateOne({_id: this.id}, {$set: {
            'maxmmr': this.maxmmr
        }});
    }
}

module.exports = Player;