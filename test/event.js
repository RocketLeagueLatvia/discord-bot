const assert = require('assert');
const rewire = require('rewire');
const event = rewire('../lib/event');
const { getClient } = require('./lib/mongo');

const getEventClient = function () {
    return getClient(event);
};

const getCollection = function () {
    return getEventClient().collection('events');
};

const deleteEvents = function (...ids) {
    return getCollection().deleteMany({ _id: {
        $in: ids
    }});
};

describe('Event', function() {

    describe('#create()', function() {
        it('should create a new Event', async function () {
            let eventName = 'Test event',
                collection = getCollection(),
                eventCount = await collection.count(),
                e;

            e = await event.create(eventName);

            assert.equal(await collection.count(), eventCount + 1, 'Event count doesn\'t match');
            assert.equal(eventName, e.name, 'Event was created with incorrect name');
            assert.ok(e instanceof event, 'create() didn\'t return an Event instance');

            deleteEvents(e._id);
        });
    });

    describe('#findById()', function() {
        it('should be able to find an event by an ID', async function () {
            let e = await event.create('Test event');
            let e2 = await event.findById(e._id);
            deleteEvents(e._id, e2._id);

            assert.equal(e._id.toString(), e2._id.toString(), 'Event names don\'t match');
            assert.ok(e2 instanceof event, 'findById() didn\'t return an Event instance');

        });
    });

    describe('#findByName()', function() {
        it('should be able to find an event by an name', async function () {
            let eventName = 'Test event';
            let e = await event.create(eventName);
            let e2 = await event.findByName(eventName);
            deleteEvents(e._id);

            assert.equal(e.name, e2.name, 'Names do not match.');
            assert.ok(e2 instanceof event, 'findByName doesn\'t return an event');
        });
    });

    describe('#findCurrentEvent()', function() {
        it('should be able to find the latest open and visible event', async function () {
            // TODO: Refactor this when event creation timestamps are added.
            let e = await event.create('Test event');

            await e.show();
            await e.openRegistration();

            let eCurrent = await event.findCurrentEvent();

            assert.equal(eCurrent._id.toString(), e._id.toString(), 'Returned event isn\'t the current one');
            assert.ok(eCurrent instanceof event, 'findCurrentEvent() didn\'t return an Event instance');

            deleteEvents(eCurrent._id);
        });
    });

    describe('#findVisible()', function() {
        it('should be able to find only visible events', async function () {
            let collection = getCollection();
            let visibleEventCount = await collection.count({ visible: true });
            let e = await event.create('Test event');
            let e2;

            await collection.updateOne({ _id: e._id }, {
                $set: {visible: false}
            });

            let visibleEvents = await event.findVisible();

            assert.equal(visibleEventCount, visibleEvents.length, 'Visible event count is incorrect');

            // Update created event to visible and check if "findVisible()" contains Event instances
            // That way we also check if newest event is first
            await collection.updateOne({ _id: e._id }, {
                $set: {visible: true}
            });

            visibleEvents = await event.findVisible();
            e2 = visibleEvents[0];

            assert.equal(e._id.toString(), e2._id.toString(), 'Incorrect ordering of events returned');
            assert.ok(e2 instanceof event, 'findVisible() doesn\'t return Event instances');

            deleteEvents(e._id);

        });
    });

    describe('#openRegistration()', function() {
        it('should open registrations for the current event', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.registration': event.STATUS.CLOSED}
            });
            await e.openRegistration();

            assert.equal(e.status.registration, event.STATUS.OPEN);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.status.registration, e2.status.registration);

            deleteEvents(e._id);
        });
    });

    describe('#closeRegistration()', function() {
        it('should close registrations for the current event', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.registration': event.STATUS.OPEN}
            });
            await e.closeRegistration();

            assert.equal(e.status.registration, event.STATUS.CLOSED);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.status.registration, e2.status.registration);

            deleteEvents(e._id);
        });
    });

    describe('#openCheckIn()', function() {
        it('should open checkIn for the current event', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.checkIn': event.STATUS.CLOSED}
            });
            await e.openCheckIn();

            assert.equal(e.status.checkIn, event.STATUS.OPEN);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.status.checkIn, e2.status.checkIn);

            deleteEvents(e._id);
        });
    });

    describe('#closeCheckIn()', function() {
        it('should close checkIn for the current event', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'status.checkIn': event.STATUS.OPEN}
            });
            await e.closeCheckIn();

            assert.equal(e.status.checkIn, event.STATUS.CLOSED);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.status.checkIn, e2.status.checkIn);

            deleteEvents(e._id);
        });
    });

    describe('#show()', function() {
        it('should set the current event to visible', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'visible': false}
            });
            await e.show();

            assert.equal(e.visible, true);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.visible, e2.visible);

            deleteEvents(e._id);
        });
    });

    describe('#hide()', function() {
        it('should set the current event to hidden', async function () {
            let e = await event.create('Test event');
            let collection = getCollection();

            await collection.updateOne({ _id: e._id }, {
                $set: {'visible': true}
            });
            await e.hide();

            assert.equal(e.visible, false);

            // Check if database entry corresponds to the Event object
            let e2 = await collection.findOne({ _id: e._id });
            assert.equal(e.visible, e2.visible);

            deleteEvents(e._id);
        });
    });

    describe('#hasRegistered()', function() {
        it('should check if the player supplied is registered');
    });

    describe('#register()', function() {
        it('should register the supplied player');
    });

    describe('#checkIn()', function() {
        it('should checkin the supplied player');
    });

    describe('#getRegisteredPlayers()', function() {
        it('should return the players registered for this event');
    });

    describe('#getCheckedInPlayers()', function() {
        it('should return the players registered for this event');
    });

    describe('#playerIsRegistered()', function() {
        it('should return if the supplied player is registered');
    });

    after(function () {
        // Close database connection, so process ends cleanly
        getEventClient().client.close();
    });
});
