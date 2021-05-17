module.exports = {
  cli: (args) => {
    let module = null;

    if (args[0] === 'login') {
      module = './login';
    }

    if (args[0] === 'web-app') {
      module = './web-app';
    }

    if (!module) {
      console.error('Unknown command ' + args[0]);
      return;
    }

    require(module).execute(...args.slice(1));
  },
};
