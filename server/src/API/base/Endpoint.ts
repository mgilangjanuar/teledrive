import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import requireDir from 'require-dir'

interface RouteOptions {
  path?: string,
  middlewares?: RequestHandler[]
}

interface Route {
  method: string,
  basepath: string,
  middlewares?: RequestHandler[],
  path: string,
  handler: RequestHandler
}

export const Endpoint = {
  _handlers: [],
  register: function (dir: string): Router {
    requireDir(dir)
    const router = Router()
    for (const route of this._handlers?.filter((handler: Route) => !!handler.basepath)) {
      router[route.method](`${route.basepath}${route.path}`, ...route.middlewares || [], route.handler)
    }
    return router
  },
  API: function (basepath?: string): any {
    return (cls: new () => any): void => {
      this._handlers = this._handlers.map(handler => ({ ...handler, basepath: handler.basepath || basepath || `/${cls.name[0].toLowerCase()}${cls.name.slice(1)}` }))
    }
  },
  GET: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildHandler('get', method, descriptor, ...args))
    }
  },
  POST: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildHandler('post', method, descriptor, ...args))
    }
  },
  PATCH: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildHandler('patch', method, descriptor, ...args))
    }
  },
  PUT: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildHandler('put', method, descriptor, ...args))
    }
  },
  _buildHandler: function (method: string, route: string, descriptor: PropertyDescriptor, ...args: [(string | RouteOptions)?, RouteOptions?]): Route {
    // get path
    let path = `/${route[0].toLowerCase()}${route.slice(1)}`
    if (args[0]) {
      if (typeof args[0] === 'string') {
        path = args[0]
      } else if (typeof args[0] === 'object') {
        path = args[0].path
      }
    } else if (args[1]) {
      path = args[1].path
    }

    // build opts
    let opts: RouteOptions = {}
    if (args[0] && typeof args[0] === 'object') {
      opts = args[0] as RouteOptions
    } else if (args[1]) {
      opts = args[1] as RouteOptions
    }

    return {
      ...opts,
      method,
      basepath: null,
      path,
      handler: async function (req: Request, res: Response, next: NextFunction) {
        try {
          await descriptor.value(req, res, next)
        } catch (error) {
          return next(error)
        }
      }
    }
  }
}