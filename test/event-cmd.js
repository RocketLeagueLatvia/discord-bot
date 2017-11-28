const assert = require('assert');
const rewire = require('rewire');
const oneLine = require('common-tags').oneLine;
const Event = rewire('../lib/event');
const Player = rewire('../lib/player');
const prefix = require('../config').prefix;
const mock = require('./lib/mock');
const { getClient } = require('./lib/mongo');
const constants = require('./lib/constants');

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

const LinkCommand = require('../commands/event/link');
const UnlinkCommand = require('../commands/event/unlink');
const RegisterCommand = require('../commands/event/register');
const CheckInCommand  = require('../commands/event/checkIn');

const {Client, Message} = mock;

const client = new Client();
const msg = new Message();
const eventName = 'test----event';
const validSteamId = '76561198006819706'; // Valid steamid64 for the RLLV API

const getCollection = function () {
    return getClient(Event).collection('events');
};

const getPlayerCollection = function () {
    return getClient(Player).collection('players');
};

const getCmdName = function (cmd) {
    return `${prefix}${cmd}`;
};

const deleteMany = function (collection, ids) {
    return collection.deleteMany({ _id: {
        $in: ids
    }});
};

const deleteEvents = function (...ids) {
    return deleteMany(getCollection(), ids);
};

const deletePlayers = function (...ids) {
    return deleteMany(getPlayerCollection(), ids);
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

    const createPlayer = async function () {
        return await Player.create({
            discordid: constants.discordid, // The same as the discordid for the mock Message user
            discordnick: 'test player',
            steamid64: '1234567890',
        });
    };

    describe(getCmdName('link-steam'), function () {

        const cmd = new LinkCommand(client);
        let player;
        let unlinkedPlayer;
        let unlinkedPlayerDiscordId = '01010101010101';
        const unlinkedPlayerSteamId64 = validSteamId; // Valid steamid64 for the RLLV API
        const unlinkedPlayerMsg = new Message();
        unlinkedPlayerMsg.author.id = unlinkedPlayerDiscordId;

        before(async function () {
            player = await createPlayer();
            unlinkedPlayer = await createPlayer();

            getPlayerCollection().updateOne({ _id: unlinkedPlayer._id }, {$set: {
                discordid: unlinkedPlayerDiscordId
            }, $unset: {
                steamid64: ''
            }});

            unlinkedPlayer.discordid = unlinkedPlayerDiscordId;
            unlinkedPlayer.steamid64 = null;

        });

        it('Should ask the player to unlink their steam if it\'s already linked', async function () {
            const result = await cmd.run(msg, {steamid64: 'XYZ'} );
            assert.strictEqual('Your account is already linked. Use `unlink-steam` to unlink it.', result);
        });

        it('Should not allow using a taken steamid64', async function () {
            const result = await cmd.run(unlinkedPlayerMsg, {steamid64: player.steamid64 });
            assert.strictEqual('Someone is already using this steamid64.', result);
        });

        it('Should not allow using a steamid64 which isn\'t stored in the RLLV API', async function () {
            // FIXME: Uses the actual RLLV API
            const result = await cmd.run(unlinkedPlayerMsg, {steamid64: 0 });
            assert.strictEqual(oneLine`
                    Your steamid wasn\'t found in the http://rocketleague.lv/ database.
                    Ask an administrator to be added first.
            `, result);
        });

        it('Should link the players steamid64 to their discord id, and update the existing db record', async function () {
            // FIXME: This test shouldn't run in production mode
            await cmd.run(unlinkedPlayerMsg, {steamid64: unlinkedPlayerSteamId64 });
            const unlinkedPlayerRecord = await getPlayerCollection().findOne({ _id: unlinkedPlayer._id });
            assert.strictEqual(unlinkedPlayerRecord.steamid64, unlinkedPlayerSteamId64);
        });

        it('Should link the players steamid64 to their discord id, and create a new db record if it doesn\'t exist', async function () {
            // FIXME: This test shouldn't run in production mode

            // Free the steamid of the unlinked player
            await getPlayerCollection().findOneAndDelete({ _id: unlinkedPlayer._id });

            // Use unlinked player's discord id and steamid64
            await cmd.run(unlinkedPlayerMsg, {steamid64: unlinkedPlayerSteamId64});

            const newPlayerRecord = await getPlayerCollection().findOne({ steamid64: unlinkedPlayerSteamId64});
            assert.strictEqual(newPlayerRecord.discordid, unlinkedPlayerDiscordId);
            assert.strictEqual(newPlayerRecord.steamid64, unlinkedPlayerSteamId64);
        });

        after(async function () {
            deletePlayers(player._id, unlinkedPlayer._id);
            await getPlayerCollection().findOneAndDelete({ discordid: unlinkedPlayerDiscordId });
        });
    });

    describe(getCmdName('unlink-steam'), function () {

        const cmd = new UnlinkCommand(client);
        const unlinkedReturnMsg = 'Your account isn\'t linked. Use `link-steam` to link it!';
        let player;
        let playerWithNoSteamId;

        before(async function () {
            player = await createPlayer();
            playerWithNoSteamId = await createPlayer();
        });

        it('Should return a message if the player isn\'t found in the player database.', async function () {
            const message = new Message();
            message.author.id = '0x0x0x0x0x';

            let result = await cmd.run(message);

            assert.strictEqual(
                result,
                unlinkedReturnMsg
            );
        });

        it('Should return a message if the player has unlinked their steam (player record is found in the database, but has no steamid64 attached).', async function () {

            const playerWithNoSteamDiscordId = 'xyxyxyyxyx';
            const message = new Message();

            message.author.id = playerWithNoSteamDiscordId;

            await getPlayerCollection().updateOne({ _id: playerWithNoSteamId._id }, {
                $set: {
                    discordid: playerWithNoSteamDiscordId
                },
                $unset: {
                    steamid64: ''
                }
            });

            delete playerWithNoSteamId.steamid64;
            playerWithNoSteamId.discordid = playerWithNoSteamDiscordId;

            let result = await cmd.run(message);

            assert.strictEqual(
                result,
                unlinkedReturnMsg
            );
        });

        it('Should unlink the players steamid64 from their discord id', async function () {
            const result = await cmd.run(msg);
            const playerRecord = await getPlayerCollection().findOne({ _id: player._id });
            assert.ok(!playerRecord.steamid64);
            assert.strictEqual(
                result,
                'Account successfully unlinked!'
            );
        });

        after(async function () {
            deletePlayers(player._id, playerWithNoSteamId._id);
        });
    });

    describe(getCmdName('event-register'), function () {

        const cmd = new RegisterCommand(client);
        const playerNoSteamDiscordId = '302d-l23dl0-ld';
        const playerRealMsg = new Message();

        let player;
        let playerNoSteam;
        let playerReal;
        let event;
        let playerRealDiscordId = '01010101010101';
        let playerRealMaxMMR;

        playerRealMsg.author.id = playerRealDiscordId;

        before(async function () {
            player = await createPlayer();
            playerNoSteam = await createPlayer();
            playerReal = await createPlayer();
            playerRealMaxMMR = 1;
            event = await Event.create(eventName);

            await getPlayerCollection().updateOne({ _id: playerReal._id }, {
                $set: {
                    discordid: playerRealDiscordId,
                    steamid64: validSteamId,
                    maxmmr: playerRealMaxMMR
                }
            });
        });

        it('Shouldn\'t allow registering to invisible events', async function () {
            await getCollection().updateOne({ _id: event._id}, {
                $set: {
                    'visible': false,
                    'status.registration': Event.STATUS.OPEN
                }
            });

            const result = await cmd.run(msg, { name: eventName });

            assert.strictEqual(
                result,
                'Sorry, but I could not find the event.'
            );
        });

        it('Shouldn\'t allow registering to events which have registration closed', async function () {
            await getCollection().updateOne({ _id: event._id}, {
                $set: {
                    'visible': true,
                    'status.registration': Event.STATUS.CLOSED
                }
            });

            const result = await cmd.run(msg, { name: eventName });

            assert.strictEqual(
                result,
                'Sorry, but the registration is closed.'
            );
        });

        it('Shouldn\'t allow registering if their steam isn\'t linked', async function () {
            const message = new Message();
            message.author.id = playerNoSteamDiscordId;

            await getCollection().updateOne({ _id: event._id}, {
                $set: {
                    'visible': true,
                    'status.registration': Event.STATUS.OPEN
                }
            });

            await getPlayerCollection().updateOne({ _id: playerNoSteam._id }, {
                $set: { discordid: playerNoSteamDiscordId },
                $unset: { steamid64: ''}
            });

            delete playerNoSteam.discordid;
            playerNoSteam.discordid = playerNoSteamDiscordId;

            const result = await cmd.run(message, { name: eventName });
            assert.strictEqual(
                result,
                oneLine`
                    Looks like you haven't linked your steam id to your discord user.
                    Please, use \`link-steam\` to link it.
                `
            );
        });

        it('Should tell the player if they are already registered', async function () {
            await event.register(player);
            const result = await cmd.run(msg, { name: eventName });
            assert.strictEqual(
                result,
                'You are already registered to this event.'
            );
        });

        it('Should update their MMR on registration', async function () {
            await getCollection().updateOne({ _id: event._id}, {
                $unset: {
                    'players': [],
                }
            });

            await cmd.run(playerRealMsg, { name: eventName });

            const playerRealRecord = await getPlayerCollection().findOne({ _id: playerReal._id });

            assert.ok(playerRealRecord.maxmmr != playerRealMaxMMR);
        });

        it('Should register the player to the event', async function () {

            await getCollection().updateOne({ _id: event._id}, {
                $unset: {
                    'players': [],
                }
            });
        });

        after(async function () {
            deletePlayers(player._id, playerNoSteam._id, playerReal._id);
            deleteEvents(event._id);
        });
    });

    describe(getCmdName('event-check-in'), function () {

        const cmd = new CheckInCommand(client);
        const playerRealMsg = new Message();
        let player;
        let playerReal;
        let event;
        let playerRealDiscordId = '01010101010101';
        let playerRealMaxMMR = 1;
        playerRealMsg.author.id = playerRealDiscordId;


        before(async function () {
            player = await createPlayer();
            playerReal = await createPlayer();
            event = await Event.create(eventName);

            await getPlayerCollection().updateOne({ _id: playerReal._id }, {
                $set: {
                    discordid: playerRealDiscordId,
                    steamid64: validSteamId,
                    maxmmr: playerRealMaxMMR
                }
            });

            playerReal.discordid = playerRealDiscordId;
            playerReal.steamid64 = validSteamId;
            playerReal.maxmmr = 1;
        });

        it('Should not allow checking in to an invisible event', async function () {
            await getCollection().updateOne({ _id: event._id }, {
                $set: {
                    visible: false,
                }
            });

            assert.strictEqual(
                await cmd.run(msg, {name: eventName }),
                'Sorry, but I could not find the event.'
            );
        });

        it('Should not allow checking in if checkin for that event is closed', async function () {
            await getCollection().updateOne({ _id: event._id }, {
                $set: {
                    'visible': true,
                    'status.checkIn': Event.STATUS.CLOSED,
                }
            });

            assert.strictEqual(
                await cmd.run(msg, {name: eventName }),
                'Sorry, but the check-in is closed.'
            );
        });

        it('Should check if the player is registered to the event', async function () {
            await getCollection().updateOne({ _id: event._id }, {
                $set: {
                    'visible': true,
                    'status.checkIn': Event.STATUS.OPEN,
                    'players': []
                }
            });

            assert.strictEqual(
                await cmd.run(msg, {name: eventName }),
                oneLine`
                    You aren't registered to this event.
                    Use \`event-register ${event.name}\` to register.
                `
            );
        });

        it('Should update the max MMR on checkin', async function () {

            await event.register(playerReal);

            await cmd.run(playerRealMsg, {name: eventName});
            const playerRealRecord = await getPlayerCollection().findOne({ _id: playerReal._id });

            assert.ok(playerRealRecord.maxmmr != playerRealMaxMMR);
        });

        it('Should check the player in to the event', async function () {

            await getCollection().updateOne({ _id: event._id }, {
                $set: {
                    'visible': true,
                    'status.checkIn': Event.STATUS.OPEN,
                    'players': []
                }
            });

            await event.register(playerReal);
            await cmd.run(playerRealMsg, {name: eventName});

            const eventRecord = await getCollection().findOne({
                '_id': event._id,
                'players.discordid': playerRealDiscordId,
                'players.checkedIn': true
            });

            assert.ok(eventRecord);
        });

        after(async function () {
            deletePlayers(player._id, playerReal._id);
            deleteEvents(event._id);
        });

    });
});
