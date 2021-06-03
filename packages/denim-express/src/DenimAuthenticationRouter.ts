import { DenimDataSourceV2 } from 'denim';
import { DenimAuthenticatorV2 } from 'denim/service';
import express, { NextFunction, Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';
import { getRolesFromRequest } from './DenimAuthenticatorMiddleware';

export type CallbackResult = { userId: string; redirectUrl: string };

export abstract class DenimAuthenticationRouterProvider {
  public slug: string;
  public dataSource: DenimDataSourceV2;

  constructor(slug: string, dataSource: DenimDataSourceV2) {
    this.slug = slug;
    this.dataSource = dataSource;
  }

  /**
   * Reads body and returns the redirect URL.
   */
  public abstract authorize(
    redirectUrl: string,
    callbackUrl: string,
    body: any
  ): Promise<string>;

  /**
   * Callback after redirect.
   */
  public abstract callback(queryParams: any): Promise<CallbackResult | null>;
}

const DenimAuthenticationRouter = (
  {
    tokenSecret,
    tokenExpiry = Date.now() + 24 * 60 * 1000 * 1000,
  }: {
    tokenSecret: string;
    tokenExpiry?: number;
  },
  usersTable: string,
  dataSource: DenimDataSourceV2,
  authenticator: DenimAuthenticatorV2,
  ...providers: DenimAuthenticationRouterProvider[]
) => {
  const router = Router();

  providers.forEach((provider) => {
    router.post(`/${provider.slug}`, express.json(), async (req, res) => {
      const { redirect_url, ...params } = req.body;

      try {
        const responseUrl = await provider.authorize(
          redirect_url,
          '/auth/callback?provider=' + provider.slug,
          params
        );

        return res.json({
          redirect_url: responseUrl,
        });
      } catch (e) {
        return res.status(500).json({
          error: e.message,
        });
      }
    });

    router.use(
      `/${provider.slug}/callback`,
      express.json(),
      async (req, res) => {
        try {
          const result = await provider.callback(req.query);

          if (!result) {
            return res.status(401).json({
              error: 'Unauthorized.',
            });
          }

          const { userId, redirectUrl } = result;

          return res.json({
            accessToken: jwt.sign(
              {
                id: userId,
                expiry: Date.now() + tokenExpiry,
              },
              tokenSecret
            ),
            refreshToken: jwt.sign(
              {
                id: userId,
                expiry: Date.now() + tokenExpiry,
              },
              tokenSecret
            ),
            redirectUrl,
          });
        } catch (e) {
          return res.status(500).json({
            error: e.message,
          });
        }
      }
    );
  });

  const middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers['authorization'];

      if (header && header.indexOf('Bearer ') === 0) {
        const token = header.substring('Bearer '.length);
        const { id, expiry } = jwt.verify(token, tokenSecret) as any;

        if (Date.now() < expiry) {
          (req as any).user = await dataSource.retrieveRecord(usersTable, id);
        }
      }
    } catch (e) {
      console.error(e);
    }

    next();
  };

  router.get('/me', middleware, (req, res) => {
    res.json((req as any).user || null);
  });

  router.get('/roles', middleware, (req: Request, res: Response) => {
    const roles = getRolesFromRequest(authenticator, req);

    res.json(roles || []);
  });

  router.use((req, res) => {
    res.status(404).json({
      error: 'Unknown provider.',
    });
  });

  return {
    router,
    middleware,
  };
};

export default DenimAuthenticationRouter;
