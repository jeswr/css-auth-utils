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

## License
©2023–present
[Jesse Wright](https://github.com/jeswr),
[MIT License](https://github.com/jeswr/useState/blob/master/LICENSE).
