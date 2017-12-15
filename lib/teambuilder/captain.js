class CaptainTeamBuilder {
    static async build(event) {
        const builder = new CaptainTeamBuilder(event);
        const teamSize = event.teamBuilder.teamSize;

        if (event.teams && event.teams.length > 0) {
            // continue previous building
        } else {
            await event.setTeams(builder.players.splice(0, builder.players.length / teamSize).map(p => [p]));
        }

        return builder;
    }

    constructor(event) {
        const teamSize = event.teamBuilder.teamSize;

        this.event = event;
        this.captains = [];

        this.players = event.players.slice(0, -(event.players.length % teamSize));
        this.players.sort((a, b) => b.maxmmr - a.maxmmr);
    }

    async pick(discordid) {

    }
}

module.exports = CaptainTeamBuilder;
