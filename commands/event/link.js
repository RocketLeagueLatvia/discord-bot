const { Command } = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const Player = require('../../lib/player');
const rllv = require('../../lib/rllv-api');

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
        let discordnick = msg.member.nickname || msg.author.username;
        let rllvPlayer;

        if (player && player.steamid64) {
            // Player exists and has a steamid linked
            return msg.say('Your account is already linked. Use `unlink-steam` to unlink it.');
        }

        if (await Player.steamId64Taken(steamid64)) {
            return msg.say('Someone is already using this steamid64.');
        }

        // Steamid provided - check if user is in the rocketleague.lv database
        // before touching our own.
        try {
            rllvPlayer = await rllv.RocketLeagueAPI.getPlayer(steamid64);
        } catch (e) {
            if (e instanceof rllv.PlayerNotFoundException) {
                return msg.say(oneLine`
                    Your steamid wasn\'t found in the http://rocketleague.lv/ database.
                    Ask an administrator to be added first.
                `);
            }
            throw e;
        }

        if (player) {
            // Player exists, but doesn't have a steamid linked
            player.setParams({
                steamid64,
                maxmmr: rllvPlayer.maxmmr
            });
        } else {
            player = await Player.create({
                discordid,
                discordnick,
                steamid64,
                maxmmr: rllvPlayer.maxmmr
            });
        }

        return msg.say(`Account successfully linked`);
    }
};
