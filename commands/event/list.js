const { Command } = require('discord.js-commando');

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
        // todo: replace with formatted event list
        return msg.say(`Sorry, I can't remember any events.`);
    }
};
