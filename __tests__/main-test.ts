import { createApp } from '@jeswr/css-init-utils';
import { App } from '@solid/community-server';
import path from 'path';
import {
  getSessionFromBrowserLogin, getAuthenticatedFetch, cssRedirectFactory,
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
