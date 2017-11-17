const { Command } = require('discord.js-commando');

const Event = require('../../lib/event');

module.exports = class OpenRegistrationCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-registration-open',
            aliases: ['open-registration'],
            group: 'event',
            memberName: 'registration-open',
            description: 'Opens the registration to the specified event.',
            examples: ['openregistration RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What event do you want to open the registration to?',
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

        await event.openRegistration();

        return msg.say(`Registration to event ${event.name} opened.`);
    }
};
