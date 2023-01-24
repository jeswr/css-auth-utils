# CSS Auth Utils

This is a temporary library for logging into the Community Solid Server using [client credentials](https://communitysolidserver.github.io/CommunitySolidServer/5.x/usage/client-credentials/).

```ts
import { getAuthenticatedFetch } from '@jeswr/css-auth-utils';

const fetch = getAuthenticatedFetch({
  podName: 'example',
  email: 'hello@example.com',
  password: 'abc123',
  url: 'http://localhost:3002/'
})
```

## Logging in using the browser flow

In some testing use cases we wish to follow the browser login flow, but mock the user interaction with the browser. This can be achieved using the `cssRedirectFactory` which fills in the email and password and completes the user flow with the CSS using puppeteer.

```ts
import { cssRedirectFactory } from '@jeswr/css-auth-utils';

await session.login({
    oidcIssuer: 'http://localhost:3000/',
    redirectUrl: 'http://localhost:3001/',
    handleRedirect: cssRedirectFactory('hello@example.com', 'abc123')
  });
```

## License
©2023–present
[Jesse Wright](https://github.com/jeswr),
[MIT License](https://github.com/jeswr/useState/blob/master/LICENSE).
