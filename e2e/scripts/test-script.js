const { program } = require("commander");

const main = async (opts) => {
    const { projectKey, projectConfig } = opts;

    // Check if exactly one argument is provided
    if ((projectKey && projectConfig) || (!projectKey && !projectConfig)) {
        console.error('You must provide exactly one of <project-key> or <project-config>.');
        console.log(program.helpInformation());
        process.exit(1);
    }

    // Handle the arguments
    if (projectKey) {
        console.log('Project Key:', projectKey);
    }

    if (projectConfig) {
        console.log('Project Config:', projectConfig);
    }
    
};

// Define the program with description and arguments
program
    .description(
        'Generate a retail-react-app project using the key <project-key> or the JSON <project-config>'
    )
    .option(
        '--project-key <key>',
        'Project key',
        (value) => {
            const validKeys = [
                'retail-app-demo',
                'retail-app-ext',
                'retail-app-no-ext',
                'retail-app-private-client',
            ];
            if (!validKeys.includes(value)) {
                throw new Error('Invalid project key.');
            }
            return value;
        }
    )
    .option(
        '--project-config <config>',
        'Project config as JSON string',
        (value) => {
            try {
                return JSON.parse(value);
            } catch (e) {
                throw new Error('Invalid JSON string.');
            }
        }
    )
    .action((options) => {
        // Call the main function with parsed options
        main(options);
    });

// Parse command-line arguments
program.parse(process.argv);
