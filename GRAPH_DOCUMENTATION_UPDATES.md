# Graph Documentation Updates Required

## Overview

The KtrlPlane now provides Auth0 M2M client credentials for each project, which should be documented in the Konnektr.Graph documentation to help users set up programmatic access to their Graph resources.

## Current State

Users can now:

1. View their Auth0 client credentials in the KtrlPlane UI (Project Detail Page)
2. See authentication examples in the Graph Resource Details page
3. Copy credentials and code samples directly from the UI

## Required Documentation Updates

### 1. Create New Page: Authentication Guide

**Location:** `docs/getting-started/authentication.mdx`

**Content:**

````mdx
---
title: Authentication
description: Authenticate your applications with Konnektr.Graph using Auth0
---

# Authentication

Konnektr.Graph uses Auth0 for authentication. Each project automatically receives machine-to-machine (M2M) client credentials for programmatic access.

## Getting Your Credentials

1. Navigate to your project in [KtrlPlane](https://ktrlplane.konnektr.io)
2. View the **API Authentication** section on the project overview page
3. Your credentials will include:
   - **Client ID**: Your application identifier
   - **Client Secret**: Your application secret (keep this secure!)
   - **Audience**: Your Graph API URL (e.g., `https://my-project.api.graph.konnektr.io`)

## Authentication Flow

Konnektr.Graph uses the OAuth 2.0 Client Credentials flow:

1. Request an access token from Auth0 using your client credentials
2. Include the access token in your API requests

### Step 1: Get an Access Token

<Tabs items={['cURL', 'Python', 'JavaScript', 'C#']}>
  <Tab>
    ```bash
    curl --request POST \
      --url https://YOUR_AUTH0_DOMAIN/oauth/token \
      --header 'content-type: application/json' \
      --data '{
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET",
        "audience": "https://YOUR_PROJECT_ID.api.graph.konnektr.io",
        "grant_type": "client_credentials"
      }'
    ```
  </Tab>
  <Tab>
    ```python
    import requests

    token_url = "https://YOUR_AUTH0_DOMAIN/oauth/token"
    token_data = {
        "client_id": "YOUR_CLIENT_ID",
        "client_secret": "YOUR_CLIENT_SECRET",
        "audience": "https://YOUR_PROJECT_ID.api.graph.konnektr.io",
        "grant_type": "client_credentials"
    }
    response = requests.post(token_url, json=token_data)
    access_token = response.json()["access_token"]
    ```

  </Tab>
  <Tab>
    ```javascript
    const axios = require('axios');

    const tokenUrl = 'https://YOUR_AUTH0_DOMAIN/oauth/token';
    const tokenData = {
      client_id: 'YOUR_CLIENT_ID',
      client_secret: 'YOUR_CLIENT_SECRET',
      audience: 'https://YOUR_PROJECT_ID.api.graph.konnektr.io',
      grant_type: 'client_credentials'
    };
    const response = await axios.post(tokenUrl, tokenData);
    const accessToken = response.data.access_token;
    ```

  </Tab>
  <Tab>
    ```csharp
    using System.Net.Http;
    using System.Text.Json;

    var tokenUrl = "https://YOUR_AUTH0_DOMAIN/oauth/token";
    var tokenData = new {
        client_id = "YOUR_CLIENT_ID",
        client_secret = "YOUR_CLIENT_SECRET",
        audience = "https://YOUR_PROJECT_ID.api.graph.konnektr.io",
        grant_type = "client_credentials"
    };
    var response = await httpClient.PostAsJsonAsync(tokenUrl, tokenData);
    var result = await response.Content.ReadFromJsonAsync<TokenResponse>();
    var accessToken = result.access_token;
    ```

  </Tab>
</Tabs>

### Step 2: Use the Token in API Requests

Include the access token in the `Authorization` header:

```bash
curl --request GET \
  --url https://YOUR_PROJECT_ID.api.graph.konnektr.io/digitaltwins \
  --header 'authorization: Bearer YOUR_ACCESS_TOKEN'
```
````

## Token Management

- **Token Expiration**: Access tokens expire after a set period (typically 24 hours)
- **Token Refresh**: When a token expires, request a new one using the same credentials
- **Token Caching**: Cache tokens in your application until they expire to reduce API calls

## Security Best Practices

1. **Never expose credentials**: Keep your client secret secure and never commit it to version control
2. **Use environment variables**: Store credentials in environment variables or secure secret management systems
3. **Rotate credentials**: Regularly rotate your credentials if compromised
4. **Monitor access**: Review access logs in KtrlPlane for suspicious activity
5. **Least privilege**: Only grant necessary permissions to your applications

## Using with Azure Digital Twins SDKs

If you're using Azure Digital Twins SDKs, you'll need to implement a custom credential provider:

See our [Using Azure Digital Twins SDKs guide](/docs/graph/how-to-guides/using-azure-digital-twins-sdks) for detailed instructions.

## Troubleshooting

### Invalid Client

- Verify your client ID and secret are correct
- Check that the credentials haven't been revoked in KtrlPlane

### Invalid Audience

- Ensure the audience matches your Graph API URL exactly
- The audience should be `https://YOUR_PROJECT_ID.api.graph.konnektr.io`

### Token Expired

- Request a new token using your credentials
- Implement automatic token refresh in your application

## Next Steps

- [Quick Start Guide](/docs/graph/getting-started/quickstart) - Get started with your first digital twin
- [API Reference](/docs/graph/reference/api) - Explore the full API
- [Using Azure SDKs](/docs/graph/how-to-guides/using-azure-digital-twins-sdks) - Use familiar Azure SDKs

````

### 2. Update Existing Pages

#### `docs/getting-started/quickstart.mdx`

Add a section after setup that references authentication:

```mdx
## Authentication

Before you can interact with your Graph API, you'll need to authenticate. See the [Authentication Guide](/docs/graph/getting-started/authentication) for detailed instructions on obtaining and using access tokens.

For quick testing, you can use the [Graph Explorer](https://explorer.graph.konnektr.io) which handles authentication automatically.
````

#### `docs/getting-started/first-steps.mdx`

Add authentication reminder:

```mdx
<Callout type="info">
  **Authentication Required**: All API requests require authentication. See the
  [Authentication Guide](/docs/graph/getting-started/authentication) to get your
  credentials from KtrlPlane.
</Callout>
```

#### `docs/how-to-guides/using-azure-digital-twins-sdks.mdx`

Update the authentication section to reference the new Auth0 credentials:

```mdx
## Authentication with Custom Credentials

Konnektr.Graph uses Auth0 for authentication. You can find your client credentials in the KtrlPlane dashboard:

1. Navigate to your project in KtrlPlane
2. View the **API Authentication** section
3. Copy your Client ID and Client Secret

Then implement a custom `TokenCredential`:

[existing code examples...]
```

### 3. Update Navigation (meta.json)

#### `docs/getting-started/meta.json`

Add authentication page:

```json
{
  "quickstart": "Quick Start",
  "authentication": "Authentication",
  "setup": "Setup",
  "first-steps": "First Steps"
}
```

### 4. Update API Reference

#### `docs/reference/api.mdx`

Add authentication section at the top:

```mdx
## Authentication

All API requests must include a valid access token in the Authorization header:

\`\`\`
Authorization: Bearer YOUR_ACCESS_TOKEN
\`\`\`

See the [Authentication Guide](/docs/graph/getting-started/authentication) for instructions on obtaining access tokens.
```

## Summary

These updates will:

1. ✅ Provide clear instructions for obtaining credentials from KtrlPlane
2. ✅ Show complete authentication examples in multiple languages
3. ✅ Reference the new UI components in KtrlPlane
4. ✅ Integrate authentication guidance throughout the documentation
5. ✅ Maintain consistency with Azure Digital Twins SDK usage patterns

## Implementation Priority

1. **High Priority**: Create authentication guide page
2. **Medium Priority**: Update quickstart and first-steps with authentication references
3. **Low Priority**: Update API reference and SDK guide with credential sourcing info
