module.exports = {
    getClient: function(rewired, privVar) {
        // gets the mongodb client instance from a rewired module.
        //
        // Since module.exports in lib/mongodb is mutated on connection,
        // we need this utility function.
        privVar = privVar || 'mongodb';
        return rewired.__get__(privVar);
    }
};
