const Discord = require('discord.js');

class TournamentListEmbed {
    constructor(title, players, color) {
        this.title = title || 'Player list';
        this.color = color || 0x228B22;
        this.players = players;
        this.embed = new Discord.RichEmbed()
            .setTitle(this.title)
            .setColor(this.color);
    }

    getEmbed() {
        let playerNames = [];
        let playerMMR = [];

        this.players.forEach(player => {
            playerNames.push(player.discordnick);
            playerMMR.push(player.maxmmr);
        });

        this.embed.addField('Nickname', playerNames.join('\n'), true);
        this.embed.addField('MMR', playerMMR.join('\n'), true);

        return this.embed;
    }
}

module.exports = {TournamentListEmbed};
