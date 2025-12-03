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
    curl: `# Get an access token using client credentials
curl --request POST \\
  --url https://YOUR_AUTH0_DOMAIN/oauth/token \\
  --header 'content-type: application/json' \\
  --data '{
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://${apiUrl}",
    "grant_type": "client_credentials"
  }'

# Use the token to query your graph
curl --request GET \\
  --url https://${apiUrl}/digitaltwins \\
  --header 'authorization: Bearer YOUR_ACCESS_TOKEN'`,

    python: `# Install: pip install requests
import requests

# Get access token
token_url = "https://YOUR_AUTH0_DOMAIN/oauth/token"
token_data = {
    "client_id": "YOUR_CLIENT_ID",
    "client_secret": "YOUR_CLIENT_SECRET",
    "audience": "https://${apiUrl}",
    "grant_type": "client_credentials"
}
token_response = requests.post(token_url, json=token_data)
access_token = token_response.json()["access_token"]

# Query your graph
api_url = "https://${apiUrl}/digitaltwins"
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(api_url, headers=headers)
twins = response.json()`,

    javascript: `// Install: npm install axios
const axios = require('axios');

// Get access token
const tokenUrl = 'https://YOUR_AUTH0_DOMAIN/oauth/token';
const tokenData = {
  client_id: 'YOUR_CLIENT_ID',
  client_secret: 'YOUR_CLIENT_SECRET',
  audience: 'https://${apiUrl}',
  grant_type: 'client_credentials'
};
const tokenResponse = await axios.post(tokenUrl, tokenData);
const accessToken = tokenResponse.data.access_token;

// Query your graph
const apiUrl = 'https://${apiUrl}/digitaltwins';
const response = await axios.get(apiUrl, {
  headers: { Authorization: \`Bearer \${accessToken}\` }
});
const twins = response.data;`,
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
          <div className="flex items-center gap-2">
            <span className="font-medium min-w-[100px]">Audience:</span>
            <code className="flex-1 text-sm bg-muted rounded px-2 py-1">
              https://{apiUrl}
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
          {/* Auth0 Client Credentials */}
          <Auth0ClientSecretViewer projectId={resource.project_id} />

          {/* Code Examples */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code Examples
            </h3>
            <Tabs defaultValue="curl" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
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
