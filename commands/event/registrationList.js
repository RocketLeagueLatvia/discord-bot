const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class RegistrationListCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-registration-list',
            aliases: ['register-list'],
            group: 'event',
            memberName: 'registration-list',
            description: 'Lists the players registered to the event.',
            examples: ['registerlist RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'For what event do you want to list registered players?',
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

        // todo: replace with formatted registered player list
        return msg.say(`Yes.`);
    }
};
