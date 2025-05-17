const core = require('@actions/core')
const exec = require('@actions/exec');
const github = require('@actions/github');
const { log } = require('console');

const setupGit = async () => {
    await exec.exec(`git config --global user.name "gh-automation`);
    await exec.exec(`git config --global user.email "gh-automation@email.com`);
};

const validateBranchName = ({branchName}) => /^[a-zA-Z0-9_\-\./]+$/.test(branchName);
const validateDirectoryName = ({dirName}) => /^[a-zA-Z0-9_\-\/]+$/.test(dirName);

const setupLogger = ({debug, prefix} = {debug: false, prefix: ''}) => ({
    debug: (message) => {
        core.info(`DEBUG ${prefix}${prefix ? ' : ' : ''}${message}`);
        // extend the logging functionality
    },

    info: (message) => {
        core.info(`${prefix}${prefix ? ' : ' : ''}${message}`);
    },
    
    error: (message) => {
        core.error(`${prefix}${prefix ? ' : ' : ''}${message}`);
    }
});

async function run() {
    const baseBranch = core.getInput('base-branch', {required: true});
    const headBranch = core.getInput('head-branch', {required: true});
    const ghToken = core.getInput('gh-token', {required: true});
    const workingDir = core.getInput('working-directory', {required: true});
    const debug = core.getBooleanInput('debug');
    const logger = setupLogger({debug, prefix: '[js-dependency-update]'});

    const commonExecOpts = {
        cwd: workingDir
    };

    core.setSecret(ghToken);

    logger.debug('Validating inputs - base-branch - head-branch - working-directory');
    
    if (!validateBranchName({branchName: baseBranch})){
        core.setFailed('Invalid base branch name. branch name must include only characters, numbers, hypens, underscores, dots, and forward slashes')
        return;
    }
    if (!validateBranchName({branchName: headBranch})){
        core.setFailed('Invalid head branch name. branch name must include only characters, numbers, hypens, underscores, dots, and forward slashes')
        return;
    }
    if (!validateDirectoryName({branchName: workingDir})){
        core.setFailed('Invalid working directory name. directory name must include only characters, numbers, hypens, underscores, and forward slashes')
        return;
    }

    logger.debug(`base branch is ${baseBranch}`);
    logger.debug(`head branch is ${headBranch}`)
    logger.debug(`working directory is ${workingDir}`)

    logger.debug('checking for package updates');

    await exec.exec('npm update', [], {
        ...commonExecOpts
    });

    const gitStatus = await exec.getExecOutput('git status -s package*.json', [], {
        ...commonExecOpts
    });

    let updatesAvailable = false;
    if (gitStatus.stdout.length > 0){
        updatesAvailable = true;
        logger.debug(`there are updates available!`)        
        logger.debug(`setting up git`)
        await setupGit();
        
        logger.debug('committing and pushing package*.json changes');

        await exec.exec(`git checkout -b ${headBranch}`, [], {
            ...commonExecOpts,
        });

        await exec.exec(`git add package.json package-lock.json`, [], {
            ...commonExecOpts,
        });

        await exec.exec(`git commit -m "chore: update dependencies`, [], {
            ...commonExecOpts,
        });

        await exec.exec(`git push -u origin ${headBranch} --force`, [], {
            ...commonExecOpts,
        });

        logger.debug('fetching octokit API');
        const octokit = github.getOctokit(ghToken);

        try {
            logger.debug(`creating a PR using ${headBranch}`);
            await octokit.rest.pulls.create({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                title: 'Update NPM dependencies',
                body: 'This pull request updates NPM packages',
                base: baseBranch,
                head: headBranch
            });
        } catch (e) {
            logger.error(`something went wrong while creating the PR. check logs below.`);
            core.setFailed(e.message);
            logger.error(e);
        };

    } else {
        logger.info('No updates at this pont in time.')
    }

    logger.debug(`setting updates-available output to ${updatesAvailable}`);
    core.setOutput('updates-available', updatesAvailable);
    
      /*
  [DONE] 1. Parse inputs:
    1.1 base-branch from which to check for updates
    1.2 head-branch to use to create the PR
    1.3 Github Token for authentication purposes (to create PRs)
    1.4 Working directory for which to check for dependencies
  [DONE] 2. Execute the npm update command within the working directory
  [DONE] 3. Check whether there are modified package*.json files
  4. If there are modified files:
    4.1 Add and commit files to the head-branch
    4.2 Create a PR to the base-branch using the octokit API
  5. Otherwise, conclude the custom action
   */

    core.info("i am a custom js action")
}

run()