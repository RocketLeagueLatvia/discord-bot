const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class HideCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-hide',
            aliases: ['hide-event'],
            group: 'event',
            memberName: 'hide',
            description: 'Hides the specified event.',
            examples: ['hide RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What event do you want to hide?',
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

        await event.hide();

        return msg.say(`Event ${event.name} hidden.`);
    }
};
