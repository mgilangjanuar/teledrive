import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import { serializeError } from 'serialize-error'

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
  register: function (..._classes: any[]): Router {
    const router = Router()
    for (const route of this._handlers?.filter((handler: Route) => !!handler.basepath)) {
      router[route.method](`${route.basepath}${route.path}`,
        ...(route.middlewares || []).map((middleware: RequestHandler) => this.RequestWrapper(middleware)), route.handler)
    }
    return router
  },
  API: function (basepath?: string): any {
    return (cls: new () => any): void => {
      this._handlers = this._handlers.map((handler: Route) => ({
        ...handler,
        basepath: handler.basepath || basepath || `/${cls.name[0].toLowerCase()}${cls.name.slice(1)}`
      }))
    }
  },
  USE: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('use', method, descriptor, ...args))
    }
  },
  GET: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('get', method, descriptor, ...args))
    }
  },
  HEAD: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('head', method, descriptor, ...args))
    }
  },
  POST: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('post', method, descriptor, ...args))
    }
  },
  PATCH: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('patch', method, descriptor, ...args))
    }
  },
  PUT: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('put', method, descriptor, ...args))
    }
  },
  DELETE: function (...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_: any, method: string, descriptor: PropertyDescriptor): void => {
      this._handlers.push(this._buildRouteHandler('delete', method, descriptor, ...args))
    }
  },
  RequestWrapper: (target: RequestHandler): RequestHandler => {
    return async function (req: Request, res: Response, next: NextFunction) {
      let trial = 0
      const execute = async () => {
        try {
          return await target(req, res, next)
        } catch (error) {
          if (/.*You need to call \.connect\(\)/gi.test(error.message) && trial < 5) {
            await new Promise(res => setTimeout(res, ++trial * 1000))
            req.tg?.connect()
            return await execute()
          }
          if (process.env.ENV !== 'production') {
            console.error('RequestWrapper', error)
          }
          req.tg?.disconnect()
          const isValidCode = error.code && Number(error.code) > 99 && Number(error.code) < 599
          return next(error.code ? {
            status: isValidCode ? error.code : 500, body: {
              error: error.message, details: serializeError(error)
            }
          } : error)
        }
      }
      return await execute()
    }
  },
  _buildRouteHandler: function (method: string, route: string, descriptor: PropertyDescriptor, ...args: [(string | RouteOptions)?, RouteOptions?]): Route {
    // get path
    let path = `/${route[0].toLowerCase()}${route.slice(1)}`
    if (args[0]) {
      if (typeof args[0] === 'string') {
        path = args[0]
      } else if (args[0]?.path) {
        path = args[0].path
      }
    } else if (args[1]?.path) {
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
        let trial = 0
        const execute = async () => {
          try {
            await descriptor.value(req, res, next)
            req.tg?.disconnect()
          } catch (error) {
            if (/.*You need to call \.connect\(\)/gi.test(error.message) && trial < 5) {
              await new Promise(res => setTimeout(res, ++trial * 1000))
              req.tg?.connect()
              return await execute()
            }
            if (process.env.ENV !== 'production') {
              console.error('handler', error.message)
            }
            req.tg?.disconnect()
            const isValidCode = error.code && Number(error.code) > 99 && Number(error.code) < 599
            return next(error.code ? {
              status: isValidCode ? error.code : 500, body: {
                error: error.message, details: serializeError(error)
              }
            } : error)
          }
        }
        return await execute()
      }
    }
  }
}