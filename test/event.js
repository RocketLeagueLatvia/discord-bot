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

describe('Event', function() {

    describe('#create()', function() {
        it('should create a new Event', async function () {
            let eventName = 'Test event',
                collection = getCollection(),
                eventCount = await collection.count(),
                e;

            e = await event.create(eventName);
            assert.equal(await collection.count(), eventCount + 1);
            assert.equal(eventName, e.name);

            // Cleanup
            collection.deleteOne({_id: e._id});
        });
    });

    describe('#findById()', function() {
        it('should be able to find an event by an ID');
    });

    describe('#findByName()', function() {
        it('should be able to find an event by an ID');
    });

    describe('#findCurrentEvent()', function() {
        it('should be able to find the latest open and visible event');
    });

    describe('#findVisible()', function() {
        it('should be able to find only visible events');
    });

    describe('#openRegistration()', function() {
        it('should open registrations for the current event');
    });

    describe('#closeRegistration()', function() {
        it('should close registrations for the current event');
    });

    describe('#openCheckIn()', function() {
        it('should open checkIn for the current event');
    });

    describe('#closeCheckIn()', function() {
        it('should close checkIn for the current event');
    });

    describe('#show()', function() {
        it('should set the current event to visible');
    });

    describe('#hide()', function() {
        it('should set the current event to hidden');
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
