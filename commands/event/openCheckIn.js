const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class OpenCheckInCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-check-in-open',
            aliases: ['open-check-in'],
            group: 'event',
            memberName: 'check-in-open',
            description: 'Opens the check-in to the specified event.',
            examples: ['opencheckin RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What event do you want to open the check-in to?',
                    type: 'string',
                    default: ''
                }
            ]
        });
    }

    hasPermission(msg) {
        if (!this.client.isOwner(msg.author)) return 'Only the bot owner(s) may use this command.';
        return true;
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

        await event.openCheckIn();

        return msg.say(`Check-in to event ${event.name} opened.`);
    }
};
