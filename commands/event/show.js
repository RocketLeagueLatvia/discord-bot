const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class ShowCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-show',
            aliases: ['show-event'],
            group: 'event',
            memberName: 'show',
            description: 'Shows the specified event.',
            examples: ['show RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What event do you want to show?',
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

        await event.show();

        return msg.say(`Event ${event.name} is now visible.`);
    }
};
