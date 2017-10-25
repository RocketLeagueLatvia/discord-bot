const commando = require('discord.js-commando');
const oneLine = require('common-tags').oneLine;

module.exports = class CreateCommand extends commando.Command {
    constructor(client) {
        super(client, {
            name: 'create event',
            group: 'event',
            memberName: 'create',
            description: 'Creates an event.',
            details: '',
            examples: ['create event RLL Online 3v3 Teambuilder #4'],

            args: [
                {
                    key: 'numbers',
                    label: 'number',
                    prompt: 'What numbers would you like to add? Every message you send will be interpreted as a single number.',
                    type: 'float',
                    infinite: true
                }
            ]
        });
    }

    async run(msg, args) {
        const total = args.numbers.reduce((prev, arg) => prev + parseFloat(arg), 0);
        return msg.reply(`${args.numbers.join(' + ')} = **${total}**`);
    }
};