const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class CreateCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-create',
            aliases: ['create-event'],
            group: 'event',
            memberName: 'create',
            description: 'Creates an event.',
            examples: ['create event RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What is the name of the event?',
                    type: 'string',
                    validate: text => {
                        if (text.length < 64) return true;
                        return 'Event name is above 64 characters';
                    }
                }
            ]
        });
    }

    hasPermission(msg) {
        if (!this.client.isOwner(msg.author)) return 'Only the bot owner(s) may use this command.';
        return true;
    }

    async run(msg, { name }) {
        const event = await Event.create(name);

        return msg.say(`Event ${event.name} created.`);
    }
};
