var config = {
    development: {
        debug: true,
        port: 8888,
        host: '127.0.0.1',

        auth: {
            user: 'username',
            pass: 'password'
        }
    },
    production: {
        debug: false,
        port: 8888,
        host: 'yourwebsite.com',

        auth: {
            user: 'username',
            pass: 'password'
        }
    }
};

module.exports = config;
