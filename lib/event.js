const mongodb = require('./mongodb');
const Player = require('./player');

const STATUS = {
    OPEN: 'open',
    CLOSED: 'closed'
};

class Event {
    static async create(name) {
        const event = new Event({name});

        await mongodb.collection('events').insert(event);

        return event;
    }

    static async findById(id) {
        const data = await mongodb.collection('events').findOne({_id: id});

        if (!data) return null;

        return new Event(data);
    }

    static async findByName(name) {
        const data = await mongodb.collection('events').findOne({name});

        if (!data) return null;

        return new Event(data);
    }

    static async findCurrentEvent() {
        const events = await mongodb.collection('events').find({
            $or: [
                {'status.registration': STATUS.OPEN},
                {'status.checkIn': STATUS.OPEN}
            ]
        }).sort({ _id: -1 }).toArray();

        if (!events.length) {
            return null;
        }

        return new Event(events[0]);
    }

    static async findVisible() {
        const events = await mongodb.collection('events').find({visible: true}).sort({ _id: -1 }).toArray();
        return events.map(data => new Event(data));
    }

    constructor({_id, name, players = [], visible = false, status = {registration: STATUS.CLOSED, checkIn: STATUS.CLOSED}}) {
        this._id = _id;
        this.name = name;
        this.players = players;
        this.visible = visible;
        this.status = status;
    }

    async openRegistration() {
        this.status.registration = STATUS.OPEN;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {'status.registration': STATUS.OPEN}});
    }

    async closeRegistration() {
        this.status.registration = STATUS.CLOSED;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {'status.registration': STATUS.CLOSED}});
    }

    async openCheckIn() {
        this.status.checkIn = STATUS.OPEN;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {'status.checkIn': STATUS.OPEN}});
    }

    async closeCheckIn() {
        this.status.checkIn = STATUS.CLOSED;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {'status.checkIn': STATUS.CLOSED}});
    }

    async show() {
        this.visible = true;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {visible: true}});
    }

    async hide() {
        this.visible = false;

        await mongodb.collection('events').updateOne({_id: this._id}, {$set: {visible: false}});
    }

    async hasRegistered(player) {
        let registeredPlayer = await mongodb.collection('events').findOne({
            '_id': this._id,
            'players.discordid': player.discordid
        });

        if (registeredPlayer) {
            return true;
        }

        return false;
    }

    async register(player) {

        const p = {
            discordid: player.discordid,
            discordnick: player.discordnick,
            steamid64: player.steamid64,
            maxmmr: player.maxmmr,
            checkedIn: false
        };

        this.players.push(p);

        await mongodb.collection('events').updateOne({_id: this._id}, {$push: {
            players: p
        }});

    }

    async checkIn(player) {
        await mongodb.collection('events').updateOne({
            '_id': this._id,
            'players.discordid': player.discordid
        }, {$set: {'players.$.checkedIn': true, 'players.$.maxmmr': player.maxmmr}});
    }

    async getRegisteredPlayers() {
        const results = await mongodb.collection('events').aggregate([
            {$match: {'_id': this._id }},
            {$unwind: '$players'},
            {$project: {'players': 1, '_id': 0}},
            {$sort: {'players.maxmmr': -1}}
        ]).toArray();

        return results.map(player => {
            return new Player(player.players);
        });
    }

    async getCheckedInPlayers() {
        const results = await mongodb.collection('events').aggregate([
            {$match: {'_id': this._id }},
            {$unwind: '$players'},
            {$match: {'players.checkedIn': true }},
            {$project: {'players': 1, '_id': 0}},
            {$sort: {'players.maxmmr': -1}}
        ]).toArray();

        return results.map(player => {
            return new Player(player.players);
        });
    }

    async playerIsRegistered(discordid) {
        if (isNaN(discordid)) return null;

        return Boolean(await mongodb.collection('events').findOne({
            _id: this._id,
            'players.discordid': discordid
        }));
    }
}

Event.STATUS = STATUS;

module.exports = Event;
