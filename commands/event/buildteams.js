const { Command } = require('discord.js-commando');

const Event = require('../../lib/event');
const TeamBuilder = require('../../lib/teambuilder');

module.exports = class BuildTeamsCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'event-build-teams',
            aliases: ['build-teams'],
            group: 'event',
            memberName: 'build-teams',
            description: 'Starts the team building',
            examples: ['buildteams captains 3 RLL Online 3v3 Teambuilder #4'],
            guildOnly: true,
            args: [
                {
                    key: 'method',
                    prompt: 'Use `captains` or `random`?',
                    type: 'string',
                    validate: method => {
                        if (['captains', 'random'].includes(method)) return true;
                        return 'Please choose method `captains` or `random`.';
                    }
                },
                {
                    key: 'teamSize',
                    prompt: 'What is the team size (2 or 3)?',
                    type: 'integer',
                    validate: size => {
                        if ([2, 3].includes(parseInt(size))) return true;
                        return 'Please choose size `2` or `3`.';
                    }
                },
                {
                    key: 'eventName',
                    prompt: 'What is the event name?',
                    type: 'string'
                }
            ]
        });
    }

    hasPermission(msg) {
        if (!this.client.isOwner(msg.author)) return 'Only the bot owner(s) may use this command.';
        return true;
    }

    async run(msg, { method, teamSize, eventName }) {
        let event = await Event.findByName(eventName);

        if (!event) {
            return msg.say(`Sorry, but I could not find the event.`);
        }

        const checkedInPlayers = await event.getCheckedInPlayers();

        if (checkedInPlayers.length < teamSize*2) {
            return msg.say('Sorry, but there are not enough checked in players.');
        }

        await event.unsetTeams();
        await event.setTeamBuilder({
            method: method,
            teamSize: teamSize,
            channel: msg.channel.id,
            status: TeamBuilder.STATUS.IN_PROGRESS
        });

        if (method === 'random') {
            await TeamBuilder.Random.build(event);

            // send team list
            return msg.say('Done');
        }

        const builder = TeamBuilder.Captain.build(event);
    }
};
