import { createApp } from '@jeswr/css-init-utils';
import { App } from '@solid/community-server';
// @ts-ignore
import solid from 'solid-server';
import type { Server } from 'http';
import path from 'path';
import fs from 'fs';
import {
  getSessionFromBrowserLogin, getAuthenticatedFetch, cssRedirectFactory, nssRedirectFactory,
} from '../lib';

describe('Testing against a CSS instance', () => {
  let app: App;

  beforeAll(async () => {
    app = await createApp({
      port: 3000,
      loggingLevel: 'off',
      seededPodConfigJson: path.join(__dirname, '..', 'configs', 'solid-css-seed.json'),
    });
    await app.start();
  }, 15000);

  afterAll(async () => {
    await app.stop();
  }, 10000);

  it('Can retrieve a session using browser flow', async () => {
    const session = await getSessionFromBrowserLogin({
      email: 'hello@example.com',
      password: 'abc123',
      oidcIssuer: 'http://localhost:3000/',
    });

    expect(session.info).toMatchObject({
      webId: 'http://localhost:3000/example/profile/card#me',
    });

    await session.logout();
  });

  it('Can retrieve a session using browser flow with explicit redirect factory', async () => {
    const session = await getSessionFromBrowserLogin({
      email: 'hello@example.com',
      password: 'abc123',
      oidcIssuer: 'http://localhost:3000/',
      redirectFactory: cssRedirectFactory,
    });

    expect(session.info).toMatchObject({
      webId: 'http://localhost:3000/example/profile/card#me',
    });

    await session.logout();
  });

  it('Can get authenticated fetch using client credentials', async () => {
    const fetch = await getAuthenticatedFetch({
      email: 'hello@example.com',
      password: 'abc123',
      url: 'http://localhost:3000/',
      podName: 'example',
    });

    expect(fetch).toBeInstanceOf(Function);
  });
});

describe('Testing against an NSS instance', () => {
  let app: Server;
  // The user details
  const details = {
    username: 'ownername',
    webId: 'http://localhost:8443/profile/card#me',
    name: 'ownerName',
    email: 'owner@owner.email',
    idp: 'http://localhost:8443',
    hashedPassword: '$2a$10$V38ahP7KVOianSZdBQpgR.2TlfgjVTI1KPA7V70XuOPsT8eX6.id.',
  };

  beforeAll((done) => {
    // Clear out any remnant data from previous tests
    fs.rmSync(path.join(process.cwd(), '.data'), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), 'config'), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), '.db'), { recursive: true, force: true });

    app = solid({
      root: path.join(process.cwd(), '.data'),
      serverUri: details.idp,
    }).listen(8443);

    app.on('listening', () => {
      // .db isn't created until the next tick so wait until
      // then before creating the user credentials
      setTimeout(() => {
        // This adds the user credentials to the oidc database so the user can login for browser
        // tests
        fs.writeFileSync(
          path.join(
            process.cwd(),
            '.db',
            'oidc',
            'users',
            'users',
            '_key_localhost%3A8443%2Fprofile%2Fcard%23me.json',
          ),
          JSON.stringify(details),
        );
        fs.writeFileSync(
          path.join(process.cwd(), '.db', 'oidc', 'users', 'users-by-email', '_key_owner%40owner.email.json'),
          JSON.stringify({ id: 'localhost:8443/profile/card#me' }),
        );
        done();
      });
    });
  }, 15000);

  afterAll((done) => {
    app.close(done);
  }, 10000);

  it('Can retrieve a session using browser flow with explicit redirect factory', async () => {
    const session = await getSessionFromBrowserLogin({
      email: details.username,
      password: 'ownerPassword1@',
      oidcIssuer: `${details.idp}/`,
      redirectFactory: nssRedirectFactory,
    });

    expect(session.info).toMatchObject({
      webId: details.webId,
    });

    await session.logout();
  }, 20_000);
});
