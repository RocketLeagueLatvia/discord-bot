const { Command } = require('discord.js-commando');

const Event = require('../../lib/event');

module.exports = class CloseRegistration extends Command {
    constructor(client) {
        super(client, {
            name: 'event-registration-close',
            aliases: ['close-registration'],
            group: 'event',
            memberName: 'registration-close',
            description: 'Closes the registration to the specified event.',
            examples: ['closeregistration RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What event do you want to close the registration to?',
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

        await event.closeRegistration();

        return msg.say(`Registration to event ${event.name} closed.`);
    }
};
