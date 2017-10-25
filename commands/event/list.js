const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class ListCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-list',
            aliases: ['list-events', 'events'],
            group: 'event',
            memberName: 'list',
            description: 'List upcoming events.',
            examples: ['events'],
            throttling: {
                usages: 1,
                duration: 10
            }
        });
    }

    async run(msg) {
        const events = await Event.findVisible();

        // todo: replace with formatted event list
        return msg.say(`Sorry, I can't remember any events.`);
    }
};
