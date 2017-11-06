const { Command } = require('discord.js-commando');
const Player = require('../../lib/player');

module.exports = class UnlinkCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'unlink-steam',
            aliases: ['steam-unlink'],
            group: 'event',
            memberName: 'unlink-steam',
            description: 'Unlinks your Steam account from your Discord account.',
        });
    }

    async run(msg) {
        let player = await Player.findByDiscordId(msg.author.id);

        if (!player) {
            return msg.say('Your account isn\'t linked. Use `link-steam` to link it!');
        }

        await player.delete();

        return msg.say('Account successfully unlinked!');
    }
};
