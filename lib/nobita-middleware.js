const compose = require('koa-compose');
const requireJS = require('nobita-require');
const readdir = require('nobita-readdir');

function isTrue(ctx, target) {
  switch (Object.prototype.toString.call(target)) {
    case '[object String]':
      target = new RegExp(target);
      return target.test(ctx.originalUrl);
    case '[object RegExp]':
      return target.test(ctx.originalUrl);
    case '[object Function]':
      return target(ctx);
    case '[object Undefined]':
      return true;
  }
}

module.exports = app => {
  const { config } = app;
  let middlewares = {};
  let allMiddlewares = [];
  let fileName = 'middlewares';
  let middlewaresPath = readdir(`./app/${fileName}/`);


  if (!middlewaresPath.length) {
    fileName = 'middleware';
    middlewaresPath = readdir(`./app/${fileName}/`);
  }


  middlewaresPath.map((item) => {
    if (item.split(`/app/${fileName}/`)[1].indexOf('.js') != -1) {
      const key = item.split(`/app/${fileName}/`)[1].split('.js')[0].replace(/\//g, '.');
      middlewares[key] = requireJS(item);
    }
  });
  for (let key in config[fileName]) {
    const name = config[fileName][key];
    allMiddlewares.push(async (ctx, next) => {
      if (config[name]) {
        if (!isTrue(ctx, config[name].ignore) || !config[name].ignore) {
          if (isTrue(ctx, config[name].match)) {
            await middlewares[name](ctx, next);
          } else {
            await next();
          }
        } else {
          await next();
        }
      } else if (isTrue(ctx, /^\/__\w+/)) {
        await next();
      } else {
        await middlewares[name](ctx, next);
      }
    })
  }
  app.middlewares = middlewares;
  return compose(allMiddlewares);
}