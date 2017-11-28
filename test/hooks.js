const mongodb = require('../lib/mongodb');

after(async function () {
    // Close database connection after all tests have run.
    mongodb.client.close();
});
