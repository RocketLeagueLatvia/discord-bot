const assert = require('assert');
const rewire = require('rewire');
const Event = rewire('../lib/event.js');
const prefix = require('../config').prefix;
const {Client, Message} = require('./lib/mock.js');
const { getClient } = require('./lib/mongo.js');

const CreateCommand = require('../commands/event/create');
const ShowCommand = require('../commands/event/show');
const HideCommand  = require('../commands/event/hide');
const ListCommand  = require('../commands/event/list');
const CheckInListCommand = require('../commands/event/checkInList');
const RegistrationListCommand = require('../commands/event/registrationList');
const OpenRegistrationCommand = require('../commands/event/openRegistration');
const CloseRegistration = require('../commands/event/closeRegistration');
const CloseCheckInCommand = require('../commands/event/closeCheckin');
const OpenCheckInCommand  = require('../commands/event/openCheckIn');

const client = new Client();
const msg = new Message();
const eventName = 'test----event';

const getCollection = function () {
    return getClient(Event).collection('events');
};

const getCmdName = function (cmd) {
    return `${prefix}${cmd}`;
};

const deleteEvents = function (...ids) {
    return getCollection().deleteMany({ _id: {
        $in: ids
    }});
};

describe('Event commands', function () {

    describe(getCmdName('event-create'), function () {


        it('Should create an event with the supplied name', async function () {
            let cmd = new CreateCommand(client);
            let result = await cmd.run(msg, { name: eventName });
            let eventEntry = await getCollection().findOne({ name: eventName });

            assert.ok(result.includes(eventName));
            assert.ok(eventEntry);
            assert.strictEqual(eventEntry.name, eventName);
        });

        after(async function () {
            await getCollection().findOneAndDelete({ name: eventName });
        });
    });

    describe('Event visibility', function () {

        let event, latestEvent;

        before(async function () {
            event = await Event.create('Old');
            latestEvent = await Event.create(eventName);
        });

        describe(getCmdName('event-show'), function () {

            const cmd = new ShowCommand(client);

            it('Should find an event and set it to visible if the name is provided.', async function () {
                await cmd.run(msg, { name: event.name });
                const eventRecord = await getCollection().findOne({ _id: event._id });
                assert.ok(eventRecord.visible);
            });

            it('Should find the latest event and set it to visible if no name is provided.', async function () {
                const collection = getCollection();

                await collection.updateOne({ _id: latestEvent._id}, {$set: {visible: false }});

                await collection.updateMany({ _id: {$in: [
                    latestEvent._id, event._id
                ]}}, {$set: {'status.registration': Event.STATUS.OPEN }});

                await cmd.run(msg, { name: '' });

                const eventRecord = await collection.findOne({ _id: latestEvent._id });
                assert.ok(eventRecord.visible);
            });

            it('Should find return a message if no event is found for the given name.', async function () {
                const result = await cmd.run(msg, { name: 'some nonexistent event'});
                assert.strictEqual('Sorry, but I could not find the event.', result);
            });

        });

        describe(getCmdName('event-hide'), function () {

            const cmd = new HideCommand(client);

            before(async function () {
                await event.show();
                await latestEvent.show();
            });

            it('Should hide the event when a valid name is provided', async function () {
                await cmd.run(msg, {name: event.name});
                const eventRecord = await getCollection().findOne({ _id: event._id});
                assert.ok(!eventRecord.visible);
            });

            it('Should hide the the latest event when no name is provided', async function () {
                await cmd.run(msg, {name: ''});
                const eventRecord = await getCollection().findOne({ _id: latestEvent. _id });
                assert.ok(!eventRecord.visible);
            });

            it('Should just return a message when no event is found', async function () {
                const result = await cmd.run(msg, {name: 'ThereIsNoEventNamedLikeThis'});
                assert.strictEqual(result, 'Sorry, but I could not find the event.');
            });

        });

        after(async function() {
            deleteEvents(event._id, latestEvent._id);
        });
    });

    describe(getCmdName('event-list'), function () {

        const cmd = new ListCommand(client);
        let event;

        before(async function () {
            event = await Event.create(eventName);
            await event.show();
        });

        it('Should list upcoming events (those events which have visible set to true)', async function () {
            const result = await cmd.run(msg);   
            assert.ok(result.hasOwnProperty('embed'));

            const fields = result.embed.fields;
            assert.ok(fields[0].value.includes(event.name));
            assert.ok(fields[1].value.includes(event.status.registration));
            assert.ok(fields[2].value.includes(event.status.checkIn));
        });

        it('Should return a message if no events are upcoming', async function () {
            // FIXME: Perhaps add a variable to config like "production" which skips this test.
            // otherwise, all events in db will be set to invisible.
            await getCollection().updateMany({}, {
                $set: { visible: false }
            });
            assert.strictEqual(await cmd.run(msg), 'Sorry, there are no upcoming events.');   

        });

        after(async function() {
            deleteEvents(event._id);
            // FIXME: Needs to respect "production" variable
            await getCollection().updateMany({}, {
                $set: { visible: true }
            });
        });
    });

    describe('Registered and checked in player lists', function () {

        let event, latestEvent, emptyEvent;
        const player = {
            'discordid' : '1234567890',
            'discordnick' : 'testplayer',
            'steamid64' : '12345678970',
            'maxmmr' : 1000,
            'checkedIn' : true
        };

        before(async function () {

            event = await Event.create(eventName);
            emptyEvent = await Event.create('Empty----event');
            latestEvent = await Event.create('Relevant----event');

            await getCollection().updateMany({ _id: {$in: [event._id, latestEvent. _id] }}, {
                $push: {'players': player},
                $set: {
                    'status.registration': Event.STATUS.OPEN,
                    'status.checkIn': Event.STATUS.OPEN,
                    'visible': true
                }
            });
        });

        describe(getCmdName('event-registration-list'), function () {

            const cmd = new RegistrationListCommand(client); 

            it('Should show the players registered for the specified event if the name is provided', async function () {
                const result = await cmd.run(msg, {name: event.name});
                assert.ok(result.hasOwnProperty('embed'));

                const fields = result.embed.fields;
                assert.strictEqual(fields[0].value, 'testplayer');
                assert.strictEqual(fields[1].value, '1000');
            });

            it('Should show the players registered for the latest event no name is provided', async function () {
                const result = await cmd.run(msg, {name: ''});
                assert.ok(result.hasOwnProperty('embed'));
                assert.ok(result.embed.title.includes(latestEvent.name));
            });

            it('Should show a message if the event wasn\'t found or is invisible', async function () {
                assert.strictEqual(
                    await cmd.run(msg, {name: 'This event doesn\'t exist'}),
                    'Sorry, but I could not find the event.'
                );
            });

            it('Should show a message if the event doesn\'t have any registered Players', async function () {
                await getCollection().updateOne({ _id: emptyEvent._id}, { $set: {
                    'visible': true,
                    'status.registration': Event.STATUS.OPEN,
                }});

                assert.strictEqual(
                    await cmd.run(msg, {name: emptyEvent.name}),
                    'There are no players registered for this event.'
                );
            });
        });

        describe(getCmdName('event-check-in-list'), function () {

            const cmd = new CheckInListCommand(client); 

            it('Should list checked in players if name is provided', async function () {
                const result = await cmd.run(msg, {name: event.name});
                assert.ok(result.hasOwnProperty('embed'));

                const fields = result.embed.fields;
                assert.strictEqual(fields[0].value, 'testplayer');
                assert.strictEqual(fields[1].value, '1000');
            });

            it('Should list checked in players to the latest event if no name is provided', async function () {
                const result = await cmd.run(msg, {name: ''});
                assert.ok(result.hasOwnProperty('embed'));
                assert.ok(result.embed.title.includes(latestEvent.name));
            });

            it('Should return a message if no event was found provided', async function () {
                assert.strictEqual(
                    await cmd.run(msg, {name: 'This event doesn\'t exist'}),
                    'Sorry, but I could not find the event.'
                );
            });

            it('Should return a message if event doesn\'t have any players checked in', async function () {
                await getCollection().updateOne({ _id: event._id }, {
                    $set: { 'players.0.checkedIn': false }
                });

                assert.strictEqual(
                    await cmd.run(msg, {name: event.name}),
                    'There are no players checked in for this tournament.'
                );
            });
        });

        after(async function() {
            deleteEvents(event._id, latestEvent._id, emptyEvent._id);
        });

    });

    describe(getCmdName('event-registration-open'), function () {

        const cmd = new OpenRegistrationCommand(client);
        let event;

        before(async function () {
            event = await Event.create(eventName);
            await getCollection().updateOne({$id: event._id}, {
                $set: {
                    'status.registration': Event.STATUS.CLOSED
                }
            });
        });

        it('Should open the registration for the specified event', async function () {
            await cmd.run(msg, {name: event.name});
            let eventRecord = await getCollection().findOne({ _id: event._id });
            assert.strictEqual(eventRecord.status.registration, Event.STATUS.OPEN);
        });

        it('Should return a message if the event isn\'t found', async function () {
            assert.strictEqual(
                await cmd.run(msg, {name: 'ThisIsProbablyAnEventWhichDoesn\'tExist'}),
                'Sorry, but I could not find the event.'
            );
        });

        after(async function() {
            deleteEvents(event._id);
        });
    });

    describe(getCmdName('event-registration-close'), function () {

        const cmd = new CloseRegistration(client);
        let event, latestEvent;

        before(async function () {
            event = await Event.create(eventName);
            latestEvent = await Event.create('latest---event');
            await getCollection().updateMany({_id: {$in: [event._id, latestEvent]}}, {$set: {
                'visible': true,
                'status.registration': Event.STATUS.OPEN
            }});
        });

        it('Should close the registration for the specified event', async function () {
            await cmd.run(msg, {name: event.name});
            const eventRecord = await getCollection().findOne({ _id: event._id});
            assert.strictEqual(eventRecord.status.registration, Event.STATUS.CLOSED);
        });

        it('Should close the registration for the current event if no name is provided', async function () {
            await cmd.run(msg, {name: ''});
            const eventRecord = await getCollection().findOne({ _id: latestEvent._id});
            assert.strictEqual(eventRecord.status.registration, Event.STATUS.CLOSED);
        });

        it('Should return a message if no event is found', async function () {
            assert.strictEqual(
                await cmd.run(msg, {name: 'ThisEventDefinitelyDoesn\'tExist'}),
                'Sorry, but I could not find the event.'
            );
        });

        after(async function() {
            deleteEvents(event._id, latestEvent._id);
        });
    });

    describe(getCmdName('event-check-in-close'), function () {
        const cmd = new CloseCheckInCommand(client);
        let event, latestEvent;

        before(async function () {
            event = await Event.create(eventName);
            latestEvent = await Event.create('latest---event');
            await getCollection().updateMany({_id: {$in: [event._id, latestEvent]}}, {$set: {
                'visible': true,
                'status.registration': Event.STATUS.OPEN,
                'status.checkIn': Event.STATUS.OPEN
            }});
        });

        it('Should close the checkin for the specified event', async function () {
            await cmd.run(msg, {name: eventName});
            const eventEntry = await getCollection().findOne({_id: event. _id});
            assert.strictEqual(eventEntry.status.checkIn, Event.STATUS.CLOSED);
        });

        it('Should close the checkin for the current event if the name isn\'t provided', async function () {
            await cmd.run(msg, {name: ''});
            const eventRecord = await getCollection().findOne({ _id: latestEvent._id});
            assert.strictEqual(eventRecord.status.registration, Event.STATUS.CLOSED);
        });

        it('Should return a message if the event wasn\'t found', async function () {
            assert.strictEqual(
                await cmd.run(msg, {name: 'ThisEventDefinitelyDoesn\'tExist'}),
                'Sorry, but I could not find the event.'
            );
        });

        after(async function() {
            deleteEvents(event._id, latestEvent._id);
        });
    });

    describe(getCmdName('event-check-in-open'), function () {

        const cmd = new OpenCheckInCommand(client);
        let event, latestEvent;

        before(async function () {
            event = await Event.create(eventName);
            latestEvent = await Event.create('latest---event');
            await getCollection().updateMany({_id: {$in: [event._id, latestEvent._id]}}, {$set: {
                'visible': true,
                'status.registration': Event.STATUS.OPEN,
                'status.checkIn': Event.STATUS.CLOSED
            }});
        });

        it('Should open the checkin for the specified event', async function () {
            await cmd.run(msg, {name: event.name});
            const eventEntry = await getCollection().findOne({ _id: event._id });
            assert.strictEqual(eventEntry.status.checkIn, Event.STATUS.OPEN);
        });

        it('Should open the checkin for the current event if the name isn\'t specified', async function () {
            await cmd.run(msg, {name: ''});
            const eventEntry = await getCollection().findOne({ _id: latestEvent._id });
            assert.strictEqual(eventEntry.status.checkIn, Event.STATUS.OPEN);
        });

        it('Should return a message if the event wasn\'t found', async function () {
            assert.strictEqual(
                await cmd.run(msg, {name: 'ThisEventDefinitelyDoesn\'tExist'}),
                'Sorry, but I could not find the event.'
            );
        });

        after(async function() {
            deleteEvents(event._id, latestEvent._id);
        });
    });
});

describe('Player commands', function () {

    describe(getCmdName('link-steam'), function () {
        it('Should link the players steamid64 to their discord id');
    });

    describe(getCmdName('unlink-steam'), function () {
        it('Should unlink the players steamid64 from their discord id');
    });

    describe(getCmdName('event-register'), function () {
        it('Should register the player to the event');
    });

    describe(getCmdName('event-check-in'), function () {
        it('Should check the player in to the event');
    });
});
