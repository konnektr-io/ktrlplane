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
import { Copy, BookOpen, Code, ExternalLink, Key } from "lucide-react";
import { useState } from "react";
import { Auth0ClientSecretViewer } from "@/features/projects/components/Auth0ClientSecretViewer";

export default function GraphResourceDetails({
  resource,
}: {
  resource: Resource;
}) {
  const apiUrl = `${resource.resource_id}.api.graph.konnektr.io`;
  const explorerUrl = `https://explorer.graph.konnektr.io?x-adt-url=${apiUrl}`;
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1200);
  };

  // Code examples for different languages
  const codeExamples = {
    curl: `# 1) Get an access token (Client Credentials)
ACCESS_TOKEN=$(curl -s -X POST \
  -H "content-type: application/json" \
  -d '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://graph.konnektr.io",
    "grant_type": "client_credentials"
  }' \
  https://auth.konnektr.io/oauth/token | jq -r .access_token)

# 2) Upload a simple DTDL model (Room)
curl -s -X POST \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
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
  ]' \
  https://${apiUrl}/models

# 3) Create a simple twin using that model
curl -s -X PUT \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type: application/json" \
  --data '{
    "$dtId": "room-1",
    "$metadata": { "$model": "dtmi:com:sample:Room;1" },
    "name": "Sample Room",
    "temperature": 21.5
  }' \
  https://${apiUrl}/digitaltwins/room-1

# 4) Query twins (now returns the twin we just created)
curl -s -X POST \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -H "content-type": application/json \
  --data '{ "query": "SELECT * FROM digitaltwins" }' \
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
      { "@type": "Property", "name": "name", "schema": "string" },
      { "@type": "Property", "name": "temperature", "schema": "double" }
      ]
    }
  ]
  requests.post(models_url, json=model_payload, headers=headers)

  # 3) Create twin
  put_twin_url = "https://${apiUrl}/digitaltwins/room-1"
  twin_payload = {
    "$dtId": "room-1",
    "$metadata": { "$model": "dtmi:com:sample:Room;1" },
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

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication Setup
          </CardTitle>
          <CardDescription>
            Use these credentials for machine-to-machine (M2M) authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Token endpoint:</span>
            <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
              https://auth.konnektr.io/oauth/token
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(`https://${apiUrl}`, "audience")}
              title="Copy Audience (for Auth0 token requests)"
            >
              <Copy
                className={`h-4 w-4 ${
                  copied === "audience" ? "text-green-600" : ""
                }`}
              />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Audience:</span>
            <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
              https://graph.konnektr.io
            </code>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleCopy(`https://${apiUrl}`, "audience")}
              title="Copy Audience (for Auth0 token requests)"
            >
              <Copy
                className={`h-4 w-4 ${
                  copied === "audience" ? "text-green-600" : ""
                }`}
              />
            </Button>
          </div>
          {/* Auth0 Client Credentials */}
          <Auth0ClientSecretViewer projectId={resource.project_id} />

          {/* Code Examples */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code Examples
            </h3>
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
          </div>

          {/* Additional Resources */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Additional Resources</h3>
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
