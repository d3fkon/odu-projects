const express = require('express');
const router = express.Router();
const Octokit = require('@octokit/rest');
const {conn} = require('../config')

router.get('/hooky', (req, res) => {
    console.log('WEB HOOKED GET');
    console.log(req)
    res.send('hooked')
})

router.post('/hooky', async (req, res) => {
    console.log('WEB HOOKED POST');
    const userName = req.body.repository.owner.name;
    const repoName = req.body.repository.name;

    const stmt = 'SELECT oauth FROM USER WHERE user_name = ?';
    const result = await conn.query(stmt, [userName]);
    console.log(userName)
    console.log(result)
    const octokit = new Octokit({
        auth: result[0]['oauth']
    });
    const octoRes = await octokit.repos.getContents({
        owner: userName,
        repo: repoName,
        path: 'config.yaml'
    })
    console.log(octoRes);
    const fileContentb64 = octoRes.data.content;
    const fileContent = Buffer.from(fileContentb64, 'base64').toString('ascii');
    const stmt2 = 'UPDATE repo SET config = ? where name = ? AND  user_name = ?';
    const result2 = conn.query(stmt2, [fileContent, repoName, userName]);
    res.send('Hooked')
})


module.exports = router;