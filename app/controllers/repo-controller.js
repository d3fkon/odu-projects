const express = require('express');
const router = express.Router();
const Octokit = require('@octokit/rest');
const { conn } = require('../config')
const { inspect } = require('util');
const axios = require('axios');
const YAML = require('json2yaml');
const url = process.env.JENKINS_URL
const verifyUser = require('./auth-helpers')

const buildPaths = (c_tree, pathString, paths) => {
    pathString += c_tree.module.split('@#@')[0];
    if (c_tree.children === undefined) {
        paths.push(pathString);
        return;
    }
    if (c_tree.children.length === 0) {
        pathString += '/.gitkeep'
        paths.push(pathString);
        return
    }

    pathString += '/'
    c_tree.children.forEach((e, i) => buildPaths(e, pathString, paths))

}
const buildPathsWithIds = (c_tree, pathString, paths) => {
    pathString += c_tree.module;
    if (c_tree.children === undefined) {
        paths.push(pathString);
        return;
    }
    if (c_tree.children.length === 0) {
        pathString += '/.gitkeep'
        paths.push(pathString);
        return
    }

    pathString += '/'
    c_tree.children.forEach((e, i) => buildPathsWithIds(e, pathString, paths))

}
/**
 * AUTHENTICATED
 * Crates a new repository
 * 
 * req.body - 
 *  repo name as 'repo'
 */
router.post('/new', async (req, res) => {
    const { repoName, oauth } = req.body;
    // const { token } = req.headers;

    // TODO: make a database call to fetch the OAuth token from the server
    const OAuth = process.env.OAUTH;
    const repositoryName = repoName;
    const clientWithAuth = new Octokit({
        auth: oauth
    });
    try {

        const creationResponse = await clientWithAuth.repos.createForAuthenticatedUser({
            name: repositoryName
        });
        console.log('CREATED REPO - ', repositoryName)
        res.send("Lesseee")
    }
    catch (e) {
        res.send("Repo creation failed")
    }
});


const buildLookup = (node, parent, lookup) => {
    node.parent = parent;
    lookup[node.module] = node;
    // this.setState({
    //   lookup: {...this.state.lookup, [node.module]: node}
    // })
    if (node.children) {
        for (var i = 0; i < node.children.length; i++) {
            buildLookup(node.children[i], node, lookup);
        }
    }
}


/**
 * AUTHENTICATED
 * Adds new files to the Repository
 * 
 * req.body - 
 *  repo name as 'repo'
 *  file name as 'path'
 */
// TODO: Make the request POST to get data from the client
router.post('/add', async (req, res) => {
    const now = new Date();
    const dateTime = now.toISOString();
    const { repoName, tree, oauth, userName, templateName, templateDesc,
        justTemplate, justRepo, templateId } = req.body;
    // const { token } = req.headers;

    // const path = [];

    //TODO: Fetch username from DB as the owner
    const owner = userName;
    const repo = repoName;
    const branch = 'master';
    console.log(JSON.stringify(tree))
    // const path = 'yoo/fileName/one_deeper';
    const message = '';
    const yamlConfig = {
        metaData: {
            author: userName,
            "git-repo": 'https://github.com/' + userName + '/' + repoName,
            approval: {
                "approved-by": userName,
                "approval-date": Date.now()
            }
        },
        job: {
            "job-name": userName + 'x' + repoName,
            config: {
                "pre-unit-test": "yes",
                "post-unit-test": "no",
                "dev": "no"
            }
        }
    };
    const jenkinsFileContent = `
    pipeline {
        agent any
    
        stages {
            stage('Build') {
                steps {
                    echo 'Building..'
                }
            }
            stage('Test') {
                steps {
                    echo 'Testing..'
                }
            }
            stage('Deploy') {
                steps {
                    echo 'Deploying....'
                }
            }
        }
    }
    `
    const OAuth = process.env.OAUTH;
    // JUST TEMPLATE
    const nonCircularTree = inspect(tree);
    let data = {};
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (!justRepo) {
        data = await conn.query('INSERT INTO template(string, user_name, name, descr, created_on) values(?, ?, ?, ?, ?)', [JSON.stringify(tree), userName, templateName, templateDesc, dateTime]);
        if (justTemplate) {
            res.send({
                success: true
            })
            return;
        }
        data.insertId = templateId
    }

    let paths = [];
    let pathsWithIds = [];
    buildPathsWithIds(tree, '/', pathsWithIds)
    buildPaths(tree, '/', paths)
    paths = paths.map(path => path.slice(3));
    pathsWithIds = pathsWithIds.map(path => path.slice(3));
    paths.push('config.yaml');
    // paths.push('Jenkinsfile');
    pathsWithIds.push('config.yaml@#@lel');
    // pathsWithIds.push('Jenkinsfile@#@lel');
    // paths.shift();
    // pathsWithIds.shift();
    console.log(paths);
    console.log(pathsWithIds);
    const clientWithAuth = new Octokit({
        auth: oauth
    });
    const lookupTable = {}
    const configContent = YAML.stringify(yamlConfig);
    buildLookup(tree, null, lookupTable);
    lookupTable['config.yaml@#@lel'] = {
        module: 'config.yaml',
        content: configContent
    };
    // lookupTable['Jenkinsfile@#@lel'] = {
    //     module: 'Jenkinsfile',
    //     content: jenkinsFileContent
    // }

    console.log("OAUTH: ", oauth)

    try {
        let sha = ''
        await (pathsWithIds.reduce(async (promise, path, index) => {
            const structure = path.split('/');
            console.log('---', structure)
            const actualPath = paths[index];
            const content = structure
            console.log('--', lookupTable[structure[structure.length - 1]])
            try {
                await promise;
                const creationResponse = await clientWithAuth.repos.createOrUpdateFile({
                    owner,
                    repo,
                    path: actualPath,
                    message,
                    content: lookupTable[structure[structure.length - 1]] ? Buffer.from(lookupTable[structure[structure.length - 1]].content.toString()).toString('base64') : '',
                    branch,
                    committer: {
                        name: userName,
                        email: 'api.cs.odu.edu@gmail.com'
                    },
                    author: {
                        name: userName,
                        email: 'a@email.com'
                    },
                });
                // sha = creationResponse.data.content.sha
                console.log("Creation Response", creationResponse)
            }
            catch (e) {
                if (e.toString() === "HttpError: Bad credentials") {
                    res.send({
                        success: false,
                        unauth: true
                    });
                    return;
                }
                console.log('ERRRR => ' + path + e.toString())
                throw e
                res.send({
                    success: false,
                    error: 'Error Creating Repository for path ' + path
                })
                return;
            }
        }, Promise.resolve()));
        await conn.query('INSERT INTO repo(template_id, name, descr, user_name, config) VALUES(?, ?, ?, ?, ?)', [data.insertId, repoName, 'https://github.com/' + userName + '/' + repoName, userName, configContent])
        await createJob(userName, repoName);
        await createHook(userName, repoName, clientWithAuth);
        res.setHeader('Access-Control-Allow-Origin', '*')

        res.send({
            success: true,
            data: 'Successfully Done'
        });

    }
    catch (error) {
        console.log('Main Error: ' + error.toString())
        // res.send({
        //     success: false
        // })
        throw error
    }
});
const createHook = async (userName, repoName, octokit) => {
    const hook = await octokit.repos.createHook({
        owner: userName,
        repo: repoName,
        config: {
            url: 'https://secondforlife.serveo.net' + '/hook/hooky',
            "content_type": "json",
            "insecure_ssl": 1,
            events: ["PushEvent"]
        }
    })
    console.log('Hook Created')
    console.log(hook)
}
const createJob = async (userName, repoName) => {
    const config = {
        method: 'post',
        url: url + '/createItem?name=' + userName + 'x' + repoName,
        headers: {
            'Content-Type': 'text/xml',
            'Jenkins-Crumb': '229197af9a8a8848910435790b87b8fa'
        },
        body: `<?xml version='1.1' encoding='UTF-8'?>
        <flow-definition plugin="workflow-job@2.33">
<description/>
<keepDependencies>false</keepDependencies>
<properties>
<jenkins.model.BuildDiscarderProperty>
<strategy class="hudson.tasks.LogRotator">
<daysToKeep>1</daysToKeep>
<numToKeep>1</numToKeep>
<artifactDaysToKeep>-1</artifactDaysToKeep>
<artifactNumToKeep>-1</artifactNumToKeep>
</strategy>
</jenkins.model.BuildDiscarderProperty>
<org.jenkinsci.plugins.workflow.job.properties.DisableConcurrentBuildsJobProperty/>
</properties>
<definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.72">
<scm class="hudson.plugins.git.GitSCM" plugin="git@3.10.1">
<configVersion>2</configVersion>
<userRemoteConfigs>
<hudson.plugins.git.UserRemoteConfig>
<url>https://github.com/${userName}/${repoName}</url>
</hudson.plugins.git.UserRemoteConfig>
</userRemoteConfigs>
<branches>
<hudson.plugins.git.BranchSpec>
<name>*/master</name>
</hudson.plugins.git.BranchSpec>
</branches>
<doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
<submoduleCfg class="list"/>
<extensions/>
</scm>
<scriptPath>Jenkinsfile</scriptPath>
<lightweight>true</lightweight>
</definition>
<triggers/>
<disabled>false</disabled>
</flow-definition>
        `
    }
    try {

        await axios.post(config.url, config.body, { headers: config.headers });
        await axios.post(url + '/job/' + userName + 'x' + repoName + '/build')
        console.log('Added and build JOB')
    }
    catch (e) {
        console.log(e)
    }
    return;

}

router.get('/list', async (req, res) => {
    const { username, oauth } = req.headers;
    const stmt1 = "SELECT oauth FROM USER where user_name = ?";
    const stmt2 = "SELECT template_id, name, descr, string from template where user_name = ?"
    try {
        const res1 = await conn.query(stmt1, [username]);
        if (res1[0]['oauth'] !== oauth) {
            res.send({
                success: false,
                unauth: true
            })
            return;
        }
        const res2 = await conn.query(stmt2, [username]);
        res.send({
            success: true,
            data: res2
        })
    }
    catch (e) {
        res.send({
            success: false,
            unauth: true
        })
    }
})

router.get('/template/:id', async (req, res) => {
    const { id } = req.params;
    const { username, oauth } = req.headers;

    if (!await verifyUser(username, oauth)) {
        res.send({
            success: false,
            unauth: true
        })
        return;
    }

    const stmt = "SELECT * from template where template_id = ? and user_name = ?";
    try {
        const result = await conn.query(stmt, [id, username]);
        const dataObj = JSON.parse(result[0]['string']);
        res.send({
            success: true,
            data: { ...result[0], string: dataObj }
        });
    }
    catch (e) {
        res.send({
            success: false,
            message: "Invalid ID"
        })
    }
});

router.post('/template/update', async (req, res) => {
    const { username, oauth } = req.headers;
    const { tree, templateId } = req.body;

    if (!await verifyUser(username, oauth)) {
        res.send({
            success: false,
            unauth: true
        })
        return;
    }
    const stmt_0 = 'SELECT * FROM template where user_name = ? AND template_id = ?';
    const result_0 = await conn.query(stmt_0, [username, templateId])
    if (result_0.length === 0) {
        res.send({
            success: false,
            unauth: true
        });
        return;
    }
    const stmt = 'UPDATE template SET string = ? where template_id = ?';
    try {
        const result = await conn.query(stmt, [JSON.stringify(tree), templateId]);
        console.log(JSON.stringify(tree))
        res.send({
            success: true,
        })
    }
    catch (e) {
        res.send({
            success: false
        })
    }
});

router.post('/templatenew', async (req, res) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Request-Headers', '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header('Access-Control-Allow-Credentials', '*')
    const { usename, oauth } = req.headers;
    const { tree, templateDesc, templateName } = req.body;
    const nonCircularTree = inspect(tree)
    const stmt = 'INSERT INTO template (name, string, user_name, descr) VALUES(?, ? ,?, ?)';
    try {
        const result = await conn.query(stmt, [templateName, JSON.stringify(nonCircularTree), username, templateDesc]);
        res.header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');
        res.send({
            success: true
        })
    }
    catch (e) {
        res.send({
            success: false
        })
    }

})


module.exports = router;