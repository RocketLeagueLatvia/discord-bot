const assert = require('assert');
const rewire = require('rewire');
const Event = rewire('../lib/event.js');
const CreateCommand = require('../commands/event/create');
const ShowCommand = require('../commands/event/show');
const prefix = require('../config').prefix;
const {Client, Message} = require('./lib/mock.js');
const { getClient } = require('./lib/mongo.js');

const client = new Client();
const msg = new Message();
const eventName = 'test event';

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

    describe(getCmdName('event-show'), function () {

        const cmd = new ShowCommand(client);
        let event, latestEvent; 

        before(async function () {
            event = await Event.create('Old');
            latestEvent = await Event.create(eventName);
        });

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

        after(async function() {
            deleteEvents(event._id, latestEvent._id);
        });
    });

});
