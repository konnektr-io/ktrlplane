import type { Resource } from "../../types/resource.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, BookOpen, Code, ExternalLink, Key, Info } from "lucide-react";
import { useState } from "react";
import { Auth0ClientSecretViewer } from "@/features/projects/components/Auth0ClientSecretViewer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useProjectSecret } from "@/features/projects/hooks/useProjectSecret";

export default function GraphResourceDetails({
  resource,
}: {
  resource: Resource;
}) {
  const apiUrl = `${resource.resource_id}.api.graph.konnektr.io`;
  const explorerUrl = `https://explorer.graph.konnektr.io?x-adt-url=${apiUrl}`;
  const [copied, setCopied] = useState<string | null>(null);

  // Check if M2M credentials exist
  const secretName = `auth0-client-${resource.project_id}`;
  const { data: m2mSecret, isLoading: isLoadingSecret } = useProjectSecret(
    resource.project_id,
    secretName
  );
  const hasM2MCredentials =
    !isLoadingSecret &&
    m2mSecret &&
    Object.keys(m2mSecret.data || {}).length > 0;

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
  };

  // Code examples - M2M (Client Credentials) or Personal (Device Code Flow)
  const codeExamples = hasM2MCredentials
    ? {
        // M2M Authentication examples
        curl: `# 1) Get an access token (Client Credentials)
ACCESS_TOKEN=$(curl -s -X POST \\
  -H "content-type: application/json" \\
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://graph.konnektr.io",
    "grant_type": "client_credentials"
  }' \\
  https://auth.konnektr.io/oauth/token | jq -r .access_token)

# 2) Upload a simple DTDL model (Room)
curl -s -X POST \\
  -H "authorization: Bearer $ACCESS_TOKEN" \\
  -H "content-type: application/json" \\
  --data '[
    {
      "@id": "dtmi:com:sample:Room;1",
      "@type": "Interface",
      "@context": ["dtmi:dtdl:context;3"],
      "displayName": "Room",
      "contents": [
        { "@type": "Property", "name": "name", "schema": "string" },
        { "@type": "Property", "name": "temperature", "schema": "double" }
      ]
    }
  ]' \\
  https://${apiUrl}/models

# 3) Create a simple twin
curl -s -X PUT \\
  -H "authorization: Bearer $ACCESS_TOKEN" \\
  -H "content-type: application/json" \\
  --data '{
    "$dtId": "room-1",
    "$metadata": { "$model": "dtmi:com:sample:Room;1" },
    "name": "Sample Room",
    "temperature": 21.5
  }' \\
  https://${apiUrl}/digitaltwins/room-1

# 4) Query twins
curl -s -X POST \\
  -H "authorization: Bearer $ACCESS_TOKEN" \\
  -H "content-type: application/json" \\
  --data '{ "query": "SELECT * FROM digitaltwins" }' \\
  https://${apiUrl}/query`,

        python: `# Install: pip install requests
import requests

# 1) Get access token
token_url = "https://auth.konnektr.io/oauth/token"
token_data = {
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "audience": "https://graph.konnektr.io",
  "grant_type": "client_credentials"
}
token_response = requests.post(token_url, json=token_data)
access_token = token_response.json().get("access_token")
headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

# 2) Upload DTDL model
models_url = "https://${apiUrl}/models"
model_payload = [
  {
    "@id": "dtmi:com:sample:Room;1",
    "@type": "Interface",
    "@context": ["dtmi:dtdl:context;3"],
    "displayName": "Room",
    "contents": [
      {"@type": "Property", "name": "name", "schema": "string"},
      {"@type": "Property", "name": "temperature", "schema": "double"}
    ]
  }
]
requests.post(models_url, json=model_payload, headers=headers)

# 3) Create twin
put_twin_url = "https://${apiUrl}/digitaltwins/room-1"
twin_payload = {
  "$dtId": "room-1",
  "$metadata": {"$model": "dtmi:com:sample:Room;1"},
  "name": "Sample Room",
  "temperature": 21.5
}
requests.put(put_twin_url, json=twin_payload, headers=headers)

# 4) Query twins
query_url = "https://${apiUrl}/query"
query_payload = {"query": "SELECT * FROM digitaltwins"}
query_response = requests.post(query_url, json=query_payload, headers=headers)
print(query_response.json())`,

        javascript: `// Install: npm install axios
import axios from 'axios';

// 1) Get access token
const tokenUrl = 'https://auth.konnektr.io/oauth/token';
const tokenData = {
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET',
  audience: 'https://graph.konnektr.io',
  grant_type: 'client_credentials'
};
const { data: token } = await axios.post(tokenUrl, tokenData);
const accessToken = token.access_token;
const headers = { Authorization: \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' };

// 2) Upload DTDL model
await axios.post('https://${apiUrl}/models', [
  {
    '@id': 'dtmi:com:sample:Room;1',
    '@type': 'Interface',
    '@context': ['dtmi:dtdl:context;3'],
    displayName: 'Room',
    contents: [
      { '@type': 'Property', name: 'name', schema: 'string' },
      { '@type': 'Property', name: 'temperature', schema: 'double' }
    ]
  }
], { headers });

// 3) Create twin
await axios.put('https://${apiUrl}/digitaltwins/room-1', {
  '$dtId': 'room-1',
  '$metadata': { '$model': 'dtmi:com:sample:Room;1' },
  name: 'Sample Room',
  temperature: 21.5
}, { headers });

// 4) Query twins
const { data } = await axios.post('https://${apiUrl}/query', { query: 'SELECT * FROM digitaltwins' }, { headers });
console.log(data);`,

        csharp: `// Install: dotnet add package System.Net.Http.Json
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

var http = new HttpClient();

// 1) Get access token
var tokenResp = await http.PostAsJsonAsync("https://auth.konnektr.io/oauth/token", new {
    client_id = "YOUR_CLIENT_ID",
    client_secret = "YOUR_CLIENT_SECRET",
    audience = "https://graph.konnektr.io",
    grant_type = "client_credentials"
});
var tokenJson = JsonDocument.Parse(await tokenResp.Content.ReadAsStringAsync());
var accessToken = tokenJson.RootElement.GetProperty("access_token").GetString();
http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

// 2) Upload DTDL model
var modelPayload = new [] {
    new {
        @id = "dtmi:com:sample:Room;1",
        @type = "Interface",
        @context = new [] { "dtmi:dtdl:context;3" },
        displayName = "Room",
        contents = new object[] {
            new { @type = "Property", name = "name", schema = "string" },
            new { @type = "Property", name = "temperature", schema = "double" }
        }
    }
};
await http.PostAsJsonAsync("https://${apiUrl}/models", modelPayload);

// 3) Create twin
var twinPayload = new {
    $dtId = "room-1",
    $metadata = new { $model = "dtmi:com:sample:Room;1" },
    name = "Sample Room",
    temperature = 21.5
};
await http.PutAsJsonAsync("https://${apiUrl}/digitaltwins/room-1", twinPayload);

// 4) Query twins
var queryPayload = new { query = "SELECT * FROM digitaltwins" };
var queryResp = await http.PostAsJsonAsync("https://${apiUrl}/query", queryPayload);
Console.WriteLine(await queryResp.Content.ReadAsStringAsync());`,
      }
    : {
        // Device Code Flow (Personal Authentication) examples
        curl: `# Authentication using Device Code Flow (Personal Account)
# This is a multi-step interactive process

# 1) Initiate device authorization
DEVICE_RESPONSE=$(curl -s -X POST \\
  -H "content-type: application/json" \\
  -d '{
    "client_id": "6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg",
    "scope": "openid profile email",
    "audience": "https://graph.konnektr.io"
  }' \\
  https://auth.konnektr.io/oauth/device/code)

# Extract codes and URL
USER_CODE=$(echo $DEVICE_RESPONSE | jq -r .user_code)
VERIFICATION_URL=$(echo $DEVICE_RESPONSE | jq -r .verification_uri_complete)
DEVICE_CODE=$(echo $DEVICE_RESPONSE | jq -r .device_code)

echo "Please visit: $VERIFICATION_URL"
echo "Or go to $(echo $DEVICE_RESPONSE | jq -r .verification_uri) and enter: $USER_CODE"

# 2) Poll for token (retry until user completes authentication)
while true; do
  TOKEN_RESPONSE=$(curl -s -X POST \\
    -H "content-type: application/json" \\
    -d "{
      \\"client_id\\": \\"6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg\\",
      \\"device_code\\": \\"$DEVICE_CODE\\",
      \\"grant_type\\": \\"urn:ietf:params:oauth:grant-type:device_code\\"
    }" \\
    https://auth.konnektr.io/oauth/token)
  
  ERROR=$(echo $TOKEN_RESPONSE | jq -r .error)
  if [ "$ERROR" = "authorization_pending" ]; then
    echo "Waiting for authentication..."
    sleep 5
  elif [ "$ERROR" = "null" ]; then
    ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r .access_token)
    echo "Authentication successful!"
    break
  else
    echo "Error: $ERROR"
    exit 1
  fi
done

# 3) Use the token to interact with the API
curl -s -X POST \\
  -H "authorization: Bearer $ACCESS_TOKEN" \\
  -H "content-type: application/json" \\
  --data '{ "query": "SELECT * FROM digitaltwins" }' \\
  https://${apiUrl}/query`,

        python: `# Install: pip install requests
import requests
import time
import webbrowser

# 1) Initiate device authorization
device_url = "https://auth.konnektr.io/oauth/device/code"
device_data = {
    "client_id": "6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg",
    "scope": "openid profile email",
    "audience": "https://graph.konnektr.io"
}
device_response = requests.post(device_url, json=device_data)
device_info = device_response.json()

print(f"Please visit: {device_info['verification_uri_complete']}")
print(f"Or go to {device_info['verification_uri']} and enter: {device_info['user_code']}")

# Optionally open browser
webbrowser.open(device_info['verification_uri_complete'])

# 2) Poll for token
token_url = "https://auth.konnektr.io/oauth/token"
token_data = {
    "client_id": "6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg",
    "device_code": device_info['device_code'],
    "grant_type": "urn:ietf:params:oauth:grant-type:device_code"
}

while True:
    token_response = requests.post(token_url, json=token_data)
    token_result = token_response.json()
    
    if 'error' in token_result:
        if token_result['error'] == 'authorization_pending':
            print("Waiting for authentication...")
            time.sleep(5)
        else:
            raise Exception(f"Error: {token_result['error']}")
    else:
        access_token = token_result['access_token']
        print("Authentication successful!")
        break

headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

# 3) Use the token
query_url = "https://${apiUrl}/query"
query_payload = {"query": "SELECT * FROM digitaltwins"}
query_response = requests.post(query_url, json=query_payload, headers=headers)
print(query_response.json())`,

        javascript: `// Install: npm install axios open
import axios from 'axios';
import open from 'open';

// 1) Initiate device authorization
const deviceUrl = 'https://auth.konnektr.io/oauth/device/code';
const deviceData = {
  client_id: '6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg',
  scope: 'openid profile email',
  audience: 'https://graph.konnektr.io'
};
const { data: deviceInfo } = await axios.post(deviceUrl, deviceData);

console.log(\`Please visit: \${deviceInfo.verification_uri_complete}\`);
console.log(\`Or go to \${deviceInfo.verification_uri} and enter: \${deviceInfo.user_code}\`);

// Optionally open browser
await open(deviceInfo.verification_uri_complete);

// 2) Poll for token
const tokenUrl = 'https://auth.konnektr.io/oauth/token';
const tokenData = {
  client_id: '6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg',
  device_code: deviceInfo.device_code,
  grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
};

let accessToken;
while (true) {
  try {
    const { data: tokenResult } = await axios.post(tokenUrl, tokenData);
    accessToken = tokenResult.access_token;
    console.log('Authentication successful!');
    break;
  } catch (err) {
    if (err.response?.data?.error === 'authorization_pending') {
      console.log('Waiting for authentication...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      throw err;
    }
  }
}

const headers = { Authorization: \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' };

// 3) Use the token
const { data } = await axios.post('https://${apiUrl}/query', 
  { query: 'SELECT * FROM digitaltwins' }, 
  { headers }
);
console.log(data);`,

        csharp: `// Install: dotnet add package System.Net.Http.Json
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Diagnostics;

var http = new HttpClient();

// 1) Initiate device authorization
var deviceResp = await http.PostAsJsonAsync("https://auth.konnektr.io/oauth/device/code", new {
    client_id = "6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg",
    scope = "openid profile email",
    audience = "https://graph.konnektr.io"
});
var deviceJson = JsonDocument.Parse(await deviceResp.Content.ReadAsStringAsync());
var verificationUrl = deviceJson.RootElement.GetProperty("verification_uri_complete").GetString();
var userCode = deviceJson.RootElement.GetProperty("user_code").GetString();
var deviceCode = deviceJson.RootElement.GetProperty("device_code").GetString();

Console.WriteLine($"Please visit: {verificationUrl}");
Console.WriteLine($"Or enter code: {userCode}");

// Optionally open browser
Process.Start(new ProcessStartInfo { FileName = verificationUrl, UseShellExecute = true });

// 2) Poll for token
string accessToken = null;
while (accessToken == null)
{
    await Task.Delay(5000);
    var tokenResp = await http.PostAsJsonAsync("https://auth.konnektr.io/oauth/token", new {
        client_id = "6LX8JHGz0T4rGNXzaBvZDWWo35fL8Kvg",
        device_code = deviceCode,
        grant_type = "urn:ietf:params:oauth:grant-type:device_code"
    });
    
    var tokenJson = JsonDocument.Parse(await tokenResp.Content.ReadAsStringAsync());
    if (tokenJson.RootElement.TryGetProperty("access_token", out var token))
    {
        accessToken = token.GetString();
        Console.WriteLine("Authentication successful!");
    }
    else if (tokenJson.RootElement.TryGetProperty("error", out var error) && 
             error.GetString() != "authorization_pending")
    {
        throw new Exception($"Error: {error.GetString()}");
    }
    else
    {
        Console.WriteLine("Waiting for authentication...");
    }
}

http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

// 3) Use the token
var queryPayload = new { query = "SELECT * FROM digitaltwins" };
var queryResp = await http.PostAsJsonAsync("https://${apiUrl}/query", queryPayload);
Console.WriteLine(await queryResp.Content.ReadAsStringAsync());`,
      };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Quick Access
          </CardTitle>
          <CardDescription>
            Tools and links for working with your Graph resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">API URL:</span>
            <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
              https://{apiUrl}
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(`https://${apiUrl}`, "apiUrl")}
              title="Copy API URL"
            >
              <Copy
                className={`h-4 w-4 ${
                  copied === "apiUrl" ? "text-green-600" : ""
                }`}
              />
            </Button>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(explorerUrl, "_blank")}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Graph Explorer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open("https://docs.konnektr.io/docs/graph", "_blank")
              }
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Authentication guidance based on credential availability */}
      {!hasM2MCredentials && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Personal Authentication Required</AlertTitle>
          <AlertDescription>
            Machine-to-machine credentials are only available for projects with:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>An active billing account with payment details</li>
              <li>An active subscription</li>
              <li>At least one paid (non-free) resource</li>
            </ul>
            <p className="mt-2">
              You can still access this resource using personal authentication
              via <strong>Device Code Flow</strong>. See the code examples below
              for implementation details.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {hasM2MCredentials && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Machine-to-Machine Authentication
            </CardTitle>
            <CardDescription>
              Use these credentials for automated, server-to-server
              authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[120px]">Token endpoint:</span>
              <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
                https://auth.konnektr.io/oauth/token
              </code>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium min-w-[120px]">Audience:</span>
              <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
                https://graph.konnektr.io
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  handleCopy("https://graph.konnektr.io", "audience")
                }
                title="Copy Audience"
              >
                <Copy
                  className={`h-4 w-4 ${
                    copied === "audience" ? "text-green-600" : ""
                  }`}
                />
              </Button>
            </div>
            <Auth0ClientSecretViewer projectId={resource.project_id} />
          </CardContent>
        </Card>
      )}

      {/* Code Examples */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {hasM2MCredentials
              ? "Code Examples (M2M)"
              : "Code Examples (Personal Auth)"}
          </CardTitle>
          <CardDescription>
            {hasM2MCredentials
              ? "Examples using machine-to-machine client credentials"
              : "Examples using Device Code Flow for personal authentication"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="curl" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="curl">cURL</TabsTrigger>
              <TabsTrigger value="python">Python</TabsTrigger>
              <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              <TabsTrigger value="csharp">C#</TabsTrigger>
            </TabsList>

            {Object.entries(codeExamples).map(([lang, code]) => (
              <TabsContent key={lang} value={lang} className="relative">
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    <code>{code}</code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => handleCopy(code, `code-${lang}`)}
                    title="Copy code"
                  >
                    <Copy
                      className={`h-4 w-4 ${
                        copied === `code-${lang}` ? "text-green-600" : ""
                      }`}
                    />
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>Documentation and guides</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href="https://docs.konnektr.io/docs/graph/getting-started/authentication"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                Authentication Guide
              </a>
            </li>
            <li>
              <a
                href="https://docs.konnektr.io/docs/graph/reference/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                API Reference
              </a>
            </li>
            <li>
              <a
                href="https://docs.konnektr.io/docs/graph/how-to-guides/using-azure-digital-twins-sdks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                <BookOpen className="h-3 w-3" />
                Using Azure Digital Twins SDKs
              </a>
            </li>
            {!hasM2MCredentials && (
              <li>
                <a
                  href="https://auth0.com/docs/get-started/authentication-and-authorization-flow/device-authorization-flow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  <BookOpen className="h-3 w-3" />
                  Device Code Flow Documentation
                </a>
              </li>
            )}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
