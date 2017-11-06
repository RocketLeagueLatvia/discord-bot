const axios = require('axios');

const RLL_API_URL = 'http://rocketleague.lv/api/maxmmr/';

function PlayerNotFoundException (message) {
    this.message = message;
}

class RocketLeagueAPI {
    static async getPlayer(steamid64) {
        if (isNaN(steamid64)) return null;
        const response = await axios.get(RLL_API_URL + steamid64);
        const data = response.data;

        if (data.hasOwnProperty('error')) {
            throw new PlayerNotFoundException(data['error']);
        }

        return data;
    }
}

module.exports = {RocketLeagueAPI, PlayerNotFoundException};