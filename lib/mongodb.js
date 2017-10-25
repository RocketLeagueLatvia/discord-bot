const MongoClient = require('mongodb').MongoClient;

const config = require('../config');

module.exports = {
    client: null,
    collection: name => module.exports.client.collection(name)
};

MongoClient.connect(config.mongodb).then(client => module.exports.client = client);
