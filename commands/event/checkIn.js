const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

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
        let event;

        if (name !== '') {
            event = await Event.findByName(name);
        } else {
            event = await Event.findCurrentEvent();
        }

        if (!event) {
            return msg.say(`Sorry, but I could not find the event.`);
        }

        if (event.status.checkIn === Event.STATUS.CLOSED) {
            return msg.say('Sorry, but the check-in is closed.');
        }

        // todo: check-in player to the event

        return msg.say(`Checked you in to ${event.name}.`);
    }
};
