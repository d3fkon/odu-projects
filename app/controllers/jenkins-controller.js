const express = require('express');
const router = express.Router();
const { conn } = require('../config')
const Octokit = require('@octokit/rest');
const yaml = require('js-yaml');
const YAML = require('json2yaml');

router.get('/repos', async (req, res) => {
    const { username, oauth } = req.headers;
    res.setHeader('Access-Control-Allow-Origin', '*')

    const result = await conn.query('SELECT name, config FROM repo WHERE user_name = ?', [username]);
    const repoNames = [];
    const structure = result.map(repo => {
        let jsonConfig = {};
        try {
            jsonConfig = (yaml.safeLoad(repo['config']))
            // if(jsonConfig === null || (!!jsonConfig) && (jsonConfig.constructor === Object))
            //     throw ""
        }
        catch (e) {
            jsonConfig = { data: false }
            console.log(e)
        }
        return {
            repoName: repo['name'],
            config: jsonConfig
        }
    });

    res.send({
        success: true,
        data: structure
    })

});

router.post('/update', async (req, res) => {
    const { username, oauth } = req.headers;
    const { newconfig } = req.body;

    const result = await conn.query('SELECT name, config FROM repo WHERE user_name = ?', [username]);
    const repoNames = [];
    const yamlConfig = {

    };
    const structure = newconfig.map(config => {
        const obj = {
            metaData: {
                author: username,
                "git-repo": 'https://github.com/' + username + '/' + config.RepoName,
                approval: {
                    "approved-by": username,
                    "approval-date": Date.now()
                }
            },
            job: {
                "job-name": username + 'x' + config.RepoName,
                config: {
                    ...config,
                    RepoName: undefined,
                    JobName: undefined
                }
            }
        }
        return {
            repoName: config.RepoName,
            config: YAML.stringify(obj)
        }
    });
    const octoKit = new Octokit({
        auth: oauth
    })
    await structure.reduce(async (promise, repoConfig) => {
        await promise;
        try {
            
            const content = await octoKit.repos.getContents({
                owner: username,
                repo: repoConfig.repoName, 
                path: 'config.yaml'
            });
            console.log(content)
            await octoKit.repos.createOrUpdateFile({
                owner: username,
                repo: repoConfig.repoName,
                path: 'config.yaml',
                message: '',
                sha: content.data.sha,
                content: Buffer.from(repoConfig.config).toString('base64'),
                branch: 'master',
                committer: {
                    name: username,
                    email: username + '@gmail.com'
                },
                author: {
                    name: username,
                    email: username + '@gmail.com'
                }
            });
            const stmt = 'UPDATE repo SET config = ? where name = ? and user_name = ?';
            const result = await conn.query(stmt, [repoConfig.config, repoConfig.repoName, username]);
            console.log(repoConfig.repoName, 'UPDATED')
        }
        catch (e) {
            console.log('Error Occured', e);
        }
    });
    res.send({
        success: true,
    })
})





module.exports = router;