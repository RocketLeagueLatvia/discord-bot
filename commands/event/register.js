const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

const Event = require('../../lib/event');

module.exports = class RegisterCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-register',
            aliases: ['register'],
            group: 'event',
            memberName: 'register',
            description: 'Registers you to the event.',
            examples: ['register RLL Online 3v3 Teambuilder #4'],
            args: [
                {
                    key: 'name',
                    prompt: 'What is the name of the event?',
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

        if (event.status.registration === Event.STATUS.CLOSED) {
            return msg.say('Sorry, but the registration is closed.');
        }

        // todo: register player to the event

        return msg.say(`Registered you to ${event.name}.`);
    }
};
