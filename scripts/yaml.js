const YAML = require('js-yaml')
const userName = 'd3fkon';
const projectName = 'habba-19';
const repoURL = 'https://github.com/d3fkon/habba-19'
const approverName = 'Sukesh'
const approvalDate = "20-2-2918"
const jsonObject = {
    metaData: {
        author: userName,
        "git-repo": repoURL,
        approval: {
            "approved-by": approverName,
            "approval-date": approvalDate,
        }
    },
    job: {
        "job-name": projectName,
        config: {
            "pre-unit-test": "yes",
            "post-unit-test": "no",
            "dev": "no"
        }
    }
}
const yiml = `
---
  metaData: x
    author: "d3fkon"
    git-repo: "https://github.com/d3fkon/PlzWord"
    approval: 
      approved-by: "d3fkon"
      approval-date: 1564192050157
  job: 
    job-name: "d3fkonxPlzWord"
    config: 
      pre-unit-test: "yes"
      post-unit-test: "no"
      dev: "no"
`

console.log(YAML.safeLoad(yiml))