const path = require('path');
const compose = require('koa-compose');
const pwd = process.cwd();
/** 中间件 */
let middlewares = [];
let allMiddlewares = [];

module.exports = config => {
  for (let i in config.middleware) {
    if (config.middleware[i]) {
      if (!middlewares[config.middleware[i]]) {
        middlewares[config.middleware[i]] = require(path.resolve(pwd, `./app/middleware/${config.middleware[i]}`));
      }
  
      if (!config[config.middleware[i]]) {
        config[config.middleware[i]] = {};
      }
  
      if (!config[config.middleware[i]].match) {
        config[config.middleware[i]].match = /\//;
      }
  
      if(config[config.middleware[i]].ignore){
        allMiddlewares.push(async (ctx, next) => {
          if (!config[config.middleware[i]].ignore.test(ctx.originalUrl)) {
            await middlewares[config.middleware[i]](ctx, next);
          } else {
            await next();
          }
        });
      } else {
        allMiddlewares.push(async (ctx, next) => {
          if (config[config.middleware[i]].match.test(ctx.originalUrl)) {
            await middlewares[config.middleware[i]](ctx, next);
          } else {
            await next();
          }
        });
      }
      
    }
  }
  return compose(allMiddlewares);
}