const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const Player = require('../../lib/player');
const Event = require('../../lib/event');

module.exports = class CheckInCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-check-in',
            aliases: ['check-in'],
            group: 'event',
            memberName: 'check-in',
            description: 'Check-in to the event.',
            examples: ['checkin RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What is the name of the event?',
                    type: 'string',
                    default: ''
                }
            ],
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg, { name }) {
        let event, player;

        if (name !== '') {
            event = await Event.findByName(name);
        } else {
            event = await Event.findCurrentEvent();
        }

        if (!event || !event.visible) {
            return msg.say(`Sorry, but I could not find the event.`);
        }

        if (event.status.checkIn === Event.STATUS.CLOSED) {
            return msg.say('Sorry, but the check-in is closed.');
        }

        if (!await event.playerIsRegistered(msg.author.id)) {
            return msg.say(oneLine`
                You aren't registered to this event.
                Use \`event-register ${event.name}\` to register.
            `);
        }

        // TODO: Handle duplicate check-ins?
        player = await Player.findByDiscordId(msg.author.id);
        await player.updateMaxMMR();
        await event.checkIn(player);

        return msg.say(`${msg.author}, checked you in to ${event.name}.`);
    }
};
