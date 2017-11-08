const mongodb = require('./mongodb');

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
        }).toArray();

        if (events.length !== 1) {
            return null;
        }

        return events[0];
    }

    static findVisible() {
        return mongodb.collection('events').find({visible: true}).map(data => new Event(data));
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
        let registeredPlayer = await mongodb.collection('events').findOne({'players._id': player._id});

        if (registeredPlayer) {
            return true;
        }

        return false;
    }

    async register(player) {
        player.checkedIn = false;

        this.players.push(player);
        
        await mongodb.collection('events').updateOne({_id: this._id}, {$push: {
            players: player
        }});

        return true;
    }

    async checkIn(player) {
        await mongodb.collection('events').updateOne({
            '_id': this._id,
            'players.discordid': player.discordid
        }, {$set: {'players.$.checkedIn': true}});
    }

    async getRegisteredPlayers() {

    }

    async getCheckedInPlayers() {

    }

    async playerIsRegistered(discordid) {
        if (isNaN(discordid)) return null;
        return await mongodb.collection('events').findOne({
            _id: this._id,
            'players.discordid': discordid
        });
    }
}

Event.STATUS = STATUS;

module.exports = Event;
