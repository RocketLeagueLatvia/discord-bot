const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const Event = require('../../lib/event');
const Player = require('../../lib/player');

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
        let event, player;

        if (name !== '') {
            event = await Event.findByName(name);
        } else {
            event = await Event.findCurrentEvent();
        }

        if (!event || !event.visible) {
            return msg.say(`Sorry, but I could not find the event.`);
        }

        if (event.status.registration === Event.STATUS.CLOSED) {
            return msg.say('Sorry, but the registration is closed.');
        }

        player = await Player.findByDiscordId(msg.author.id);

        if (!player || !player.steamid64) {
            return msg.say(oneLine`
                Looks like you haven't linked your steam id to your discord user.
                Please, use \`link-steam\` to link it.
            `);
        }

        if (await event.hasRegistered(player)) {
            return msg.say('You are already registered to this event.');
        }

        player.updateMaxMMR();
        await event.register(player);

        return msg.say(`${msg.author}, registered you to ${event.name}.`);
    }
};
