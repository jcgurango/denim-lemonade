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
          encodeURIComponent(redirectUrl) +
          '&app_id=' +
          this.connection.appId,
      });
    });

    router.get('/callback', async (req: Request, res: Response) => {
      if (req.query.type === 'web') {
        const {
          open_id,
        } = await withAppAccessToken(({ post, token }) => {
          console.log(token);
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
          token: jwt.sign({ id: open_id, expiry: Date.now() + 30 * 60 * 1000 }, this.key),
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
        }

        return next();
      } catch (e) {
        console.error(e);
        res.status(500).send();
      }
    };
  }
}
