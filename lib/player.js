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

    static async create({discordid, discordnick, steamid64, maxmmr}) {

        const player = new Player({discordid, discordnick, steamid64, maxmmr});

        await mongodb.collection('players').insert(player);

        return player;
    }

    static async findByDiscordId(discordid) {
        const data = await mongodb.collection('players').findOne({discordid: discordid});

        if (!data) return null;

        return new Player(data);
    }

    async updateMaxMMR() {
        let response;

        if (!this.steamid64) return;

        try {
            response = await rllv.RocketLeagueAPI.getPlayer(this.steamid64);
        } catch (e) {
            if (e instanceof rllv.PlayerNotFoundException) return;
            throw e;
        }
        
        const maxmmr = parseInt(response.maxmmr, 10); 

        this.maxmmr = maxmmr;
        await mongodb.collection('players').updateOne({_id: this._id}, {$set: {
            'maxmmr': maxmmr
        }});
    }

    async unsetSteamId64() {
        delete this.steamid64;
        await mongodb.collection('players').updateOne({_id: this._id}, {$unset: {
            steamid64: ''
        }});
    }

    async setParams(params) {
        // TODO: May be check if "params" contains any of the necessary keys, like steamid64, maxmmr, etc.
        if (typeof params !== 'object') return;

        await mongodb.collection('players').updateOne({_id: this._id}, {$set: params});

    }

    async delete() {
        await mongodb.collection('players').findOneAndDelete({_id: this._id});
    }

}

module.exports = Player;
