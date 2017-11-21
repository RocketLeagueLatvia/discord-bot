const assert = require('assert');
const rewire = require('rewire');
const Event = rewire('../lib/event.js');
const CreateCommand = require('../commands/event/create.js');
const prefix = require('../config').prefix;
const {Client, Message} = require('./lib/mock.js');
const { getClient } = require('./lib/mongo.js');

const client = new Client();

const getCollection = function () {
    return getClient(Event).collection('events');
};

const getCmdName = function (cmd) {
    return `${prefix}${cmd}`;
};

describe('Event commands', function () {

    describe(getCmdName('event-create'), function () {

        let eventName = 'test event';

        it('Should create an event with the supplied name', async function () {
            let cmd = new CreateCommand(client);
            let result = await cmd.run(new Message(), { name: eventName });
            let eventEntry = await getCollection().findOne({ name: eventName });

            assert.ok(result.includes(eventName));
            assert.ok(eventEntry);
            assert.strictEqual(eventEntry.name, eventName);
        });

        after(async function () {
            await getCollection().findOneAndDelete({ name: eventName });
        });
    });

});
