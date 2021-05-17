import { Request, Response, Router } from 'express';
import LarkConnection, { RequestCallback } from './LarkConnection';
import jwt from 'jsonwebtoken';

export default class LarkAuthentication {
  public connection: LarkConnection;
  public key: string;

  constructor(connection: LarkConnection, key: string) {
    this.connection = connection;
    this.key = key;
  }

  loginEndpoint() {
    const router = Router();
    const withAppAccessToken = async (
      callback: RequestCallback,
      res: Response,
    ) => {
      try {
        return await this.connection.withAppAccessToken(callback);
      } catch (e) {
        console.error(e);

        res.status(500).json({
          message: e.message,
        });
      }

      return null;
    };

    router.get('/', async (req: Request, res: Response) => {
      const redirectUrl =
        req.protocol +
        '://' +
        req.get('host') +
        req.originalUrl +
        '/callback?type=web';

      return res.json({
        url:
          'https://open.larksuite.com/open-apis/authen/v1/index?redirect_uri=' +
          encodeURIComponent(
            typeof req.query.redirect_url === 'string'
              ? req.query.redirect_url
              : redirectUrl,
          ) +
          '&app_id=' +
          this.connection.appId,
      });
    });

    router.get('/callback', async (req: Request, res: Response) => {
      if (req.query.type === 'web') {
        const { open_id } = await withAppAccessToken(({ post, token }) => {
          return post(
            'https://open.larksuite.com/open-apis/authen/v1/access_token',
            {
              app_access_token: token,
              grant_type: 'authorization_code',
              code: req.query.code,
            },
          );
        }, res);

        res.json({
          token: jwt.sign(
            { id: open_id, expiry: Date.now() + 24 * 60 * 60 * 1000 },
            this.key,
          ),
        });
      }

      if (req.query.type === 'app') {
        const { open_id } = await withAppAccessToken(({ post, token }) => {
          return post('https://open.larksuite.com/open-apis/mina/v2/tokenLoginValidate', {
            code: req.query.code,
          }, {
            Authorization: 'Bearer ' + token,
          });
        }, res);

        res.json({
          token: jwt.sign(
            { id: open_id, expiry: Date.now() + 30 * 60 * 1000 },
            this.key,
          ),
        });
      }
    });

    router.get('/verify', async (req: Request, res: Response) => {
      try {
        if (!req.query.token || typeof req.query.token !== 'string') {
          throw new Error('No token provided.');
        }

        const { expiry }: any = jwt.verify(req.query.token, this.key);

        if (expiry < Date.now()) {
          throw new Error('Token expired.');
        }

        return res.json({
          valid: true,
        });
      } catch (e) {
        console.error(e);
        return res.json({
          valid: false,
          message: e.message,
        });
      }
    });

    return router;
  }

  middleware(
    callback: (id: string, req: Request, res: Response, next: Function) => any,
  ) {
    return async (req: Request, res: Response, next: Function) => {
      try {
        const auth = req.get('Authorization');

        if (auth) {
          const token = auth.substring('Bearer '.length);
          const { id, expiry }: any = jwt.verify(token, this.key);

          if (typeof id === 'string' && Date.now() < expiry) {
            return callback(id, req, res, next);
          }

          return res.status(403).json({
            message: 'Unauthorized'
          });
        }

        return next();
      } catch (e) {
        console.error(e);
        res.status(500).send();
      }
    };
  }
}
