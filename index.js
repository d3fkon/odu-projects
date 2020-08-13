const express = require('express');
const bodyParser = require('body-parser');
const dotEnv = require('dotenv');
const result = dotEnv.config()
const config = require('./app/config');



const main = async () => {


    await config.initDB();
    if (result.error) {
        throw result.error
    }

    /**
     * Controller and Router Imports 
     */
    const authController = require('./app/controllers/auth-controller');
    const repoController = require('./app/controllers/repo-controller');
    const jenkinsController = require('./app/controllers/jenkins-controller');
    const hookController = require('./app/controllers/hook-controller');

    /** 
     *  Constant Declarations
     * */
    const PORT = 3030;
    const app = express();

    /**
     * Endpoint Handling
     */
    app.use(function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, username, oauth');
        next();
    });
    app.use(bodyParser.json());
    app.use('/auth', authController);
    app.use('/repo', repoController);
    app.use('/j', jenkinsController);
    app.use('/hook', hookController);

    app.get('/', (req, res) => {
        res.send("ASAS")
    })



    app.listen(PORT, () => {
        console.log(`Listening on http://localhost:${PORT}`);
    })
}

main()