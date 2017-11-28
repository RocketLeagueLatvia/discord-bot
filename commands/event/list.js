const Discord = require('discord.js');
const { Command } = require('discord.js-commando');
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

        if (!events.length) return msg.say('Sorry, there are no upcoming events.'); 

        const embed = new Discord.RichEmbed();
        embed.setTitle('Upcoming events');
        embed.setColor(0x4549cc);

        let eventNames = [];
        let eventStatusesRegistration = [];
        let eventStatusesCheckIn = [];

        events.forEach(ev => {
            eventNames.push(ev.name);
            eventStatusesRegistration.push(ev.status.registration);
            eventStatusesCheckIn.push(ev.status.checkIn);
        });

        embed.addField('Name', eventNames.join('\n'), true);
        embed.addField('Registration', eventStatusesRegistration.join('\n'), true);
        embed.addField('Check in', eventStatusesCheckIn.join('\n'), true);

        return msg.channel.send({embed: embed});
    }
};
