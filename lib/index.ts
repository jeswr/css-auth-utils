import type { KeyPair } from '@inrupt/solid-client-authn-core';
import {
  buildAuthenticatedFetch, createDpopHeader,
  generateDpopKeyPair,
} from '@inrupt/solid-client-authn-core';
import puppeteer from 'puppeteer';

export interface ITokenData {
  accessToken: string;
  dpopKey: KeyPair;
}

export interface ILoginDetails {
  podName: string;
  email: string;
  password: string;
  url: string;
}

export interface ISecretData {
  id: string;
  secret: string;
}

// From https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/
export function getSecret(login: ILoginDetails): Promise<ISecretData> {
  return fetch(`${login.url}idp/credentials/`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: login.podName, email: login.email, password: login.password }),
  }).then((res) => res.json());
}

// From https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/
export async function refreshToken({ id, secret }: ISecretData, url: string): Promise<ITokenData> {
  const dpopKey = await generateDpopKeyPair();
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`;
  const tokenUrl = `${url}.oidc/token`;
  const accessToken = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${Buffer.from(authString).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  })
    .then((res) => res.json())
    .then((res) => res.access_token);

  return { accessToken, dpopKey };
}

export async function getAuthenticatedFetch(login: ILoginDetails):
Promise<typeof globalThis.fetch> {
  // Generate secret
  const secret = await getSecret(login);

  // Get token
  const token = await refreshToken(secret, login.url);

  // Build authenticated fetch
  return buildAuthenticatedFetch(<any>fetch, token.accessToken, { dpopKey: token.dpopKey });
}

export function cssRedirectFactory(email: string, password: string) {
  return async function handleRedirect(url: string) {
    // Visit the redirect url
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    // Fill out the username / password form
    await page.type('input[id=email]', email);
    await page.type('input[name=password]', password);
    await page.click('button[type=submit]');

    // Navigate to the authorise page
    await page.waitForNavigation();

    // Click the authorise button
    await page.click('button[type=submit]');

    // Navigate to the authorise page
    await page.waitForNavigation();

    // Close the page and browser
    await page.close();
    await browser.close();
  };
}
