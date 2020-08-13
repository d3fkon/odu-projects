const { conn } = require('../config');

module.exports = async (userName, oAuth) => {
    try {
        const result = await conn.query('SELECT oauth FROM USER where user_name = ?', [userName]);
        return result[0]['oauth'] === oAuth;
    }
    catch (e) {
        return false;
    }
}

