const assert = require('assert');
const rewire = require('rewire');
const Event = rewire('../lib/event');
const Player = require('../lib/player');
const { getClient } = require('./lib/mongo');

const getEventClient = function () {
    return getClient(Event);
};

const getCollection = function () {
    return getEventClient().collection('events');
};

const deleteEvents = function (...ids) {
    return getCollection().deleteMany({ _id: {
        $in: ids
    }});
};

const createPlayer = function () {
    return new Player({
        discordid: '1234567890',
        discordnick: 'testplayer',
        steamid64: '1234567890',
        maxmmr: 1000
    });
};

describe('Event', function() {
    describe('#create()', function() {
        let e;
        it('should create a new Event', async function () {
            let eventName = 'Test event',
                collection = getCollection(),
                eventCount = await collection.count();

            e = await Event.create(eventName);

            assert.strictEqual(await collection.count(), eventCount + 1, 'Event count doesn\'t match');
            assert.strictEqual(eventName, e.name, 'Event was created with incorrect name');
            assert.ok(e instanceof Event, 'create() didn\'t return an Event instance');
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#findById()', function() {
        let e, e2;
        it('should be able to find an event by an ID', async function () {
            e = await Event.create('Test event');
            e2 = await Event.findById(e._id);

            assert.strictEqual(e._id.toString(), e2._id.toString(), 'Event names don\'t match');
            assert.ok(e2 instanceof Event, 'findById() didn\'t return an Event instance');

        });

        after(function () {
            deleteEvents(e._id, e2._id);
        });
    });

    describe('#findByName()', function() {
        let e;
        it('should be able to find an event by an name', async function () {
            let eventName = 'Test event';
            e = await Event.create(eventName);
            let e2 = await Event.findByName(eventName);

            assert.strictEqual(e.name, e2.name, 'Names do not match.');
            assert.ok(e2 instanceof Event, 'findByName doesn\'t return an event');
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#findCurrentEvent()', function() {
        let eCurrent;
        it('should be able to find the latest open and visible event', async function () {
            // TODO: Refactor this when event creation timestamps are added.
            let e = await Event.create('Test event');

            await e.show();
            await e.openRegistration();

            eCurrent = await Event.findCurrentEvent();

            assert.strictEqual(eCurrent._id.toString(), e._id.toString(), 'Returned event isn\'t the current one');
            assert.ok(eCurrent instanceof Event, 'findCurrentEvent() didn\'t return an Event instance');
        });

        after(function () {
            deleteEvents(eCurrent._id);
        });
    });

    describe('#findVisible()', function() {
        let e;
        it('should be able to find only visible events', async function () {
            let collection = getCollection();
            let visibleEventCount = await collection.count({ visible: true });
            let e2;

            e = await Event.create('Test event');

            await collection.updateOne({ _id: e._id }, {
                $set: {visible: false}
            });

            let visibleEvents = await Event.findVisible();

            assert.strictEqual(visibleEventCount, visibleEvents.length, 'Visible event count is incorrect');

            // Update created event to visible and check if "findVisible()" contains Event instances
            // That way we also check if newest event is first
            await collection.updateOne({ _id: e._id }, {
                $set: {visible: true}
            });

            visibleEvents = await Event.findVisible();
            e2 = visibleEvents[0];

            assert.strictEqual(e._id.toString(), e2._id.toString(), 'Incorrect ordering of events returned');
            assert.ok(e2 instanceof Event, 'findVisible() doesn\'t return Event instances');
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#openRegistration()', function() {
        let e;
        it('should open registrations for the current event', async function () {
            let collection = getCollection();

            e = await Event.create('Test event');

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.registration': Event.STATUS.CLOSED}
            });
            await e.openRegistration();

            assert.strictEqual(e.status.registration, Event.STATUS.OPEN);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.status.registration, e2.status.registration);

        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#closeRegistration()', function() {
        let e;
        it('should close registrations for the current event', async function () {
            let collection = getCollection();

            e = await Event.create('Test event');

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.registration': Event.STATUS.OPEN}
            });
            await e.closeRegistration();

            assert.strictEqual(e.status.registration, Event.STATUS.CLOSED);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.status.registration, e2.status.registration);
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#openCheckIn()', function() {
        let e;
        it('should open checkIn for the current event', async function () {
            let collection = getCollection();

            e = await Event.create('Test event');

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.checkIn': Event.STATUS.CLOSED}
            });
            await e.openCheckIn();

            assert.strictEqual(e.status.checkIn, Event.STATUS.OPEN);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.status.checkIn, e2.status.checkIn);
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#closeCheckIn()', function() {
        let e;
        it('should close checkIn for the current event', async function () {
            e = await Event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.checkIn': Event.STATUS.OPEN}
            });
            await e.closeCheckIn();

            assert.strictEqual(e.status.checkIn, Event.STATUS.CLOSED);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.status.checkIn, e2.status.checkIn);

            deleteEvents(e._id);
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#show()', function() {
        let e;
        it('should set the current event to visible', async function () {
            e = await Event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'visible': false}
            });
            await e.show();

            assert.strictEqual(e.visible, true);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.visible, e2.visible);

            deleteEvents(e._id);
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('#hide()', function() {
        let e;
        it('should set the current event to hidden', async function () {
            e = await Event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'visible': true}
            });
            await e.hide();

            assert.strictEqual(e.visible, false);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.strictEqual(e.visible, e2.visible);
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('Player registration', function () {
        let e;
        let player = createPlayer();
        let player2;
        describe('#register()', function() {
            it('should register the supplied player', async function () {
                let eventPlayer;

                e = await Event.create('Test event');

                await e.register(player);

                eventPlayer = e.players[0];
                assert.strictEqual(eventPlayer.discordid, player.discordid);

                // Check if database entry corresponds to the Event object
                let e2 = await getCollection().findOne({ _id: e._id });
                assert.strictEqual(e2.players.length, 1);
                assert.strictEqual(e2.players[0].discordid, player.discordid);
            });
        });

        describe('Registration checking', function () {
            // Check a non-registered player
            player2 = createPlayer();
            player2.discordid = 'xxx';
            describe('#hasRegistered()', function() {
                it('should check if the player supplied is registered', async function () {
                    // Check an actually registered player
                    assert.ok(await e.hasRegistered(player));

                    // Check an unregistered one
                    assert.ok(!await e.hasRegistered(player2));
                });
            });

            describe('#playerIsRegistered()', function() {
                it('should return if the supplied player is registered', async function () {
                    // Check an actually registered player
                    assert.ok(await e.playerIsRegistered(player.discordid));

                    // Check an unregistered one
                    assert.ok(!await e.playerIsRegistered(player2.discordid));
                });
            });
        });

        describe('#getRegisteredPlayers()', function() {
            it('should return the players registered for this event sorted by descending MMR', async function () {
                let registeredPlayers;
                let first;

                player2.maxmmr = 1;
                await e.register(player2);
                registeredPlayers = await e.getRegisteredPlayers();

                first = registeredPlayers[0];
                assert.ok(first instanceof Player);
                assert.strictEqual(first.discordid, player.discordid);
                assert.strictEqual(registeredPlayers[1].discordid, player2.discordid);
            });
        });

        after(function () {
            deleteEvents(e._id);
        });
    });

    describe('Player checkin', function () {
        let e;
        let player = createPlayer();
        let player2 = createPlayer();
        let player3 = createPlayer();

        player2.maxmmr = 1;
        player2.discordid = 'XXX';
        player3.discordid = 'YYY';

        before(async function () {
            e = await Event.create('Test event');
            await e.register(player);
            await e.register(player2);
            await e.register(player3);
        });

        describe('#checkIn()', function() {
            it('should checkin the supplied player', async function () {
                await e.checkIn(player);
                let eventWithCheckedInPlayer = await getCollection().findOne({
                    '_id': e._id,
                    'players.discordid': player.discordid,
                    'players.checkedIn': true
                });

                assert.ok(eventWithCheckedInPlayer);

            });
        });

        describe('#getCheckedInPlayers()', function() {
            it('should return the players checked in for this event ordered by descending MMR', async function () {
                let checkedInPlayers;
                await e.checkIn(player2);
                checkedInPlayers = await e.getCheckedInPlayers();

                let first = checkedInPlayers[0];
                assert.ok(first instanceof Player);
                assert.strictEqual(first.discordid, player.discordid);
                assert.strictEqual(checkedInPlayers[1].discordid, player2.discordid);
                assert.strictEqual(checkedInPlayers.length, 2);
            });
        });

        after(function () {
            deleteEvents(e._id);
        });
    });
});
