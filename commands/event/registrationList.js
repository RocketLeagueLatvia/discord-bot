const { Command } = require('discord.js-commando');
const Discord = require('discord.js');
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

        if (!event || !event.visible) {
            return msg.say(`Sorry, but I could not find the event.`);
        }

        const embed = new Discord.RichEmbed()
            .setTitle(`Registered players for "${event.name}"`)
            .setColor(0x228B22);
        const players = await event.getRegisteredPlayers();
        let playerNames = [];
        let playerMMR = [];

        if (!players.length) {
            return msg.say('There are no players registered for this tournament.');
        }

        players.forEach(player => {
            playerNames.push(player.discordnick);
            playerMMR.push(player.maxmmr);
        });

        embed.addField('Nickname', playerNames.join('\n'), true);
        embed.addField('MMR', playerMMR.join('\n'), true);

        return msg.channel.send({embed});
    }
};
