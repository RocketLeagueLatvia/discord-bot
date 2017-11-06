const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const Player = require('../../lib/player');

module.exports = class LinkCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'link-steam',
            aliases: ['steam-link'],
            group: 'event',
            memberName: 'link-steam',
            description: 'Links your Discord account to your Steam account.',
            examples: ['link-steam 76561197982344715'],
            args: [
                {
                    key: 'steamid64',
                    prompt: oneLine`
                        What's your steamid64?
                        If you're not sure, you can get it with https://www.steamidfinder.com/`,
                    type: 'string',
                    default: '',
                    validate: text => {
                        return !isNaN(text);
                    }
                }
            ]
        });
    }

    async run(msg, { steamid64 }) {
        let discordid = msg.author.id;
        let player = await Player.findByDiscordId(discordid);
        let discordnick = msg.member.nickname || msg.author.username

        if (player) {
            return msg.say('Your account is already linked. Use `unlink-steam` to unlink it.');
        }

        player = Player.create({
            discordid,
            discordnick,
            steamid64
        });

        return msg.say(`Account successfully linked`);
    }
};
