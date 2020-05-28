const core = require("@actions/core");
const github = require("@actions/github");

const checkDeploymentStatus = async ({ token, owner, repo, deployment_id, status_id }, MAX_TIMEOUT) => {
    const iterations = MAX_TIMEOUT / 2;
    for (let i = 0; i < iterations; i++) {
        try {

            const octokit = new github.GitHub(token);

            const result = await octokit.repos.getDeploymentStatus({
                owner,
                repo,
                deployment_id,
                status_id,
            })

            if ( result.data.state === 'success' ) {
                return result;
            } else if (result.data.state !== 'success') {
                throw Error('deployment status was not equal to `success`')
            }    

        } catch (e) {
            console.log(e);
            await new Promise((r) => setTimeout(r, 2000));
        }
    }
    core.setFailed(`Timeout reached: Unable to get deployment status`);
};

const run = async () => {
    try {        

        // Inputs
        const GITHUB_TOKEN = core.getInput('token')
        const MAX_TIMEOUT = Number(core.getInput("max_timeout")) || 60;        

        // Fail if we have don't have a github token
        if (!GITHUB_TOKEN ) {
            core.setFailed('Required field `token` was not provided')
        }

        // Wait for a successful deployment
        const deployment = await checkDeploymentStatus({
            token: GITHUB_TOKEN,
            owner: github.owner,
            repo: github.repository,
            deployment_id: github.deployment_id,
            status_id: github.status_id,
        }, MAX_TIMEOUT)

        if (deployment.data.state === 'success') {
            core.setOutput('url', deployment.data.target_url)
        } else {
            core.setFailed('Unable to get deployment status')
        }
    
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();