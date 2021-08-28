import { NextFunction, Request, RequestHandler, Response, Router } from 'express'
import requireDir from 'require-dir'

interface RouteOptions {
  method?: string,
  middlewares?: RequestHandler[]
}

interface Route {
  method: string,
  middlewares?: RequestHandler[],
  path: string,
  handler: RequestHandler
}

export class Endpoints {
  public router: Router
  private static routes: Route[]

  public constructor(directory: string) {
    requireDir(directory)
    this.router = Router()
  }

  public run(): Router {
    for (const route of Endpoints.routes || []) {
      this.router[route.method](`${route.path}`, ...route.middlewares || [], route.handler)
    }
    return this.router
  }

  public static route(cls: new () => any, ...args: [(string | RouteOptions)?, RouteOptions?]): any {
    return (_target: any, method: string, descriptor: PropertyDescriptor) => {
      // get path
      let path = `/${cls.name[0].toLowerCase()}${cls.name.slice(1)}/${method[0].toLowerCase()}${method.slice(1)}`
      if (args[0] && typeof args[0] === 'string') {
        path = `/${cls.name[0].toLowerCase()}${cls.name.slice(1)}${args[0]}`
      }

      // build opts
      let opts: RouteOptions = { method: 'get' }
      if (args[0] && typeof args[0] === 'object') {
        opts = args[0] as RouteOptions
      } else if (args[1]) {
        opts = args[1] as RouteOptions
      }

      // registering to routes
      this.routes = [...this.routes || [], {
        ...opts,
        method: opts?.method || 'get',
        path,
        handler: async (req: Request, res: Response, next: NextFunction) => {
          try {
            await descriptor.value(req, res, next)
          } catch (error) {
            return next(error)
          }
        }
      }]
    }
  }
}