const express = require('express');
const router = express.Router();
const axios = require('axios');
const { conn } = require('../config');
const uniqid = require('uniqid');
const bcrypt = require('bcrypt');
const validator = require('express-validation');
const { authValidator } = require('../valiadtors/index');
const Octokit = require('@octokit/rest');
const { Response, ERR_CODE } = require('../helpers/response');


router.post('/user/check', async (req, res) => {
    const { username } = req.body;
    const octokit = new Octokit();

    try {

        const response = await octokit.users.getByUsername({
            username
        })
        if (response.status === 200) {
            const stmt = 'SELECT * FROM USER where username = ?';
            const data = await conn.query(stmt, [username]);
            if (data.length === 0) {
                res.send({
                    success: true
                })
            }
            else res.send({
                success: false,
                error: 'Github ID already taken'
            })

        }
    }
    catch (e) {
        res.send({
            success: false,
            error: 'Invalid Github User'
        })
    }
})

router.post('/user/signup', validator(authValidator.userLogin), async (req, res) => {

    const { email, password, phone_number, college_name, name } = req.body;
    const stmt = 'INSERT INTO USER (user_id, name,  password, phone_number, college_name, registration_time , department_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    const id = uniqid('h19-');
    let department = null;
    let college = '';
    try {
        const hashedPwd = await bcrypt.hash(password, 2);
        if (college_name === 'ay_cert') {
            const str = email.split('@')[0];
            const arr = ['13', '14', '15', '16', '17', '18']
            const split1 = str.split('.');
            if (arr.includes(split1[split1.length - 2])) {
                const substr = str.substring(str.length, str.length - 4);
                college = substr.slice(0, 2).toUpperCase();
                department = substr.slice(2, 4).toUpperCase();
            }
            else if (arr.includes(split1[split1.length - 1])) {
                const substr = str.substring(str.length - 3, str.length - 7);
                college = substr.slice(0, 2).toUpperCase();
                department = substr.slice(2, 4).toUpperCase();

            }
            else {
                college = 'faculty';
                department = 'faculty';
            }
            const results = await conn.query(stmt, [id1, name, email, hashedPwd, phone_number, college, new Date(), department]);
            res.send(new Response().withToken(id1).noError());
        }
        else if (college_name !== 'ay_cert') {
            const results = await conn.query(stmt, [id, name, email, hashedPwd, phone_number, college_name, new Date(), department]);
            res.send(new Response().withToken(id).noError());

        }
    }
    catch (err) {
        console.log(err)
        res.send(new Response().withError(ERR_CODE.USER_EXISTS));
    }

});

/**
 * USER LOGIN
 * 
 * form_data
 * req.body = {
 *  email, password
 * }
 * 
 * Verify login and change id's on each login
 */
// router.post('/user/login', validator(authValidator.userLogin), async (req, res) => {
router.get('/user/login',  async (req, res) => {
    const { username, oauth } = req.headers;
    console.log(req.headers)
    const stmt1 = 'SELECT * FROM USER WHERE user_name = ?';
    const stmt2 = 'UPDATE USER SET oauth = ? where user_name = ?';
    const stmt3 = 'INSERT INTO USER (oauth, user_name) VALUES (?, ?)';
    console.log(username, oauth)
    try {
        const result = await conn.query(stmt1, [username]);

        if(result.length === 0) {
            const newResult = await conn.query(stmt3, [oauth, username]);
            res.send({
                success: true
            });
            return;
        }
        await conn.query(stmt2, [oauth, username])
        console.log('/user/login succeeded')
        res.header('Access-Control-Allow-Origin', '*');
        res.send({
            success: true
        });

    } catch (err) {
        console.log(err);
        // Invalid email condition
        res.send(new Response().withError(ERR_CODE.INVALID_USR));
    }
})

/**
 * Endpoint to get the OAuth Token from the redirect URL
 * Redirection Handler from GitHub. Query String must contain 'code' and 'state'
 */
router.get('/oauth', async (req, res) => {
    const response = await axios.post('https://github.com/login/oauth/access_token', {
        'client_id': process.env.GITHUB_CLIENT_ID,
        'client_secret': process.env.GITHUB_CLIENT_SECRET,
        'code': req.query['code'],
        'state': req.query['state']
    });
    //TODO: Store the oauth token in the database using the following userID
    const userID = req.query['state'];
    const oAuth = response.data.split('=')[1].split('&')[0];

    res.redirect('https://secondforlifeui.serveo.net/auth?oauth=' + oAuth)
    // res.redirect('http://localhost:3000/auth?oauth=' + oAuth)
});

module.exports = router;