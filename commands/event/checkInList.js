const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class CheckInListCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-check-in-list',
            aliases: ['check-in-list'],
            group: 'event',
            memberName: 'check-in-list',
            description: 'Lists the players checked-in to the event.',
            examples: ['checkinlist RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'For what event do you want to list checked-in players?',
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

        // todo: replace with formatted checked-in player list
        return msg.say(`Yes.`);
    }
};
