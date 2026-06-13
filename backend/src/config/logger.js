const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

// Xác định log level từ ENV
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug, info, warn, error
const LEVEL_PRIORITY = { debug: 0, info: 1, warn: 2, error: 3 };

function getTimestamp() {
    return new Date().toISOString();
}

class Logger {
    constructor(context = 'APP') {
        this.context = context;
    }

    log(message, level = 'info', data = null) {
        if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[LOG_LEVEL]) {
            return;
        }

        const timestamp = getTimestamp();
        let color = colors.blue;
        let levelStr = level.toUpperCase();

        switch (level) {
            case 'error':
                color = colors.red;
                break;
            case 'warn':
                color = colors.yellow;
                break;
            case 'debug':
                color = colors.cyan;
                break;
            case 'success':
                color = colors.green;
                levelStr = 'SUCCESS';
                break;
        }

        const logMessage = `${color}[${timestamp}] ${levelStr} [${this.context}]: ${message}${colors.reset}`;

        if (level === 'error') {
            console.error(logMessage, data || '');
        } else {
            console.log(logMessage, data || '');
        }
    }

    debug(message, data = null) {
        this.log(message, 'debug', data);
    }

    info(message, data = null) {
        this.log(message, 'info', data);
    }

    warn(message, data = null) {
        this.log(message, 'warn', data);
    }

    error(message, data = null) {
        this.log(message, 'error', data);
    }

    success(message, data = null) {
        this.log(message, 'success', data);
    }
}
module.exports = new Logger('BackendApp');

