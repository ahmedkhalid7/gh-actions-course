const core = require('@actions/core');

async function run() {
    try {
        const prTitle = core.getInput('pr-title');
        if (prTitle.startsWith('feat')){
            core.info('pr is a feature');
        } else {
            core.setFailed('pr is not a feature');
        }
    } catch (e) {
        core.setFailed(e.message);
    }
}