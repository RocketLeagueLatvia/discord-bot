const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;
const path = require('path');
const pino = require('pino')();
const sqlite = require('sqlite');

const config = require('./config');

const client = new commando.Client({
    commandPrefix: config.prefix,
    disableEveryone: true,
    owner: config.owners,
    unknownCommandResponse: false
});

client
    .on('error', pino.error)
    .on('warn', pino.warn)
    .on('debug', pino.debug)
    .on('ready', () => {
        pino.info(`Client ready; logged in as ${client.user.username}#${client.user.discriminator} (${client.user.id})`);
        client.user.setGame('with code');
    })
    .on('disconnect', () => {
        pino.warn('Disconnected!');
    })
    .on('reconnecting', () => {
        pino.warn('Reconnecting...');
    })
    .on('commandError', (cmd, err) => {
        if (err instanceof commando.FriendlyError) return;
        pino.error(`Error in command ${cmd.groupID}:${cmd.memberName}`, err);
    })
    .on('commandBlocked', (msg, reason) => {
        pino.info(oneLine`
			Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''}
			blocked; ${reason}
		`);
    })
    .on('commandPrefixChange', (guild, prefix) => {
        pino.info(oneLine`
			Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('commandStatusChange', (guild, command, enabled) => {
        pino.info(oneLine`
			Command ${command.groupID}:${command.memberName}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    })
    .on('groupStatusChange', (guild, group, enabled) => {
        pino.info(oneLine`
			Group ${group.id}
			${enabled ? 'enabled' : 'disabled'}
			${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.
		`);
    });

client.setProvider(
    sqlite.open(path.join(__dirname, 'database.sqlite3')).then(db => new commando.SQLiteProvider(db))
).catch(pino.error);

client.registry
    .registerDefaults()
    .registerGroup('event', 'Event Command Group')
    .registerCommandsIn(path.join(__dirname, 'commands'));

client.login(config.token);
