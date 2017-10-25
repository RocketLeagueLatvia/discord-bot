const MongoClient = require('mongodb').MongoClient;

const pino = require('pino')();

const config = require('../config');

module.exports = {
    client: null,
    collection: name => module.exports.client.collection(name)
};

MongoClient.connect(config.mongodb).then(function (client) {
    pino.info('MongoDB connected');
    module.exports.client = client
});
