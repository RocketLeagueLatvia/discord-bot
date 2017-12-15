const shuffle = require('shuffle-array');

class RandomTeamBuilder {
    static async build(event)  {
        const teams = [];
        const teamSize = event.teamBuilder.teamSize;

        let players = await event.getCheckedInPlayers();

        players = shuffle(players.slice(0, -(players.length % teamSize)));

        while (players.length > 0) {
            teams.push(players.splice(0, teamSize));
        }

        event.setTeams(teams);
    }
}

module.exports = RandomTeamBuilder;
