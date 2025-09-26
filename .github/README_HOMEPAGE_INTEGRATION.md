# Homepage Integration Instructions

## Product Discovery & Resource Creation Flow

1. **Product Discovery**

   - The homepage should display all available Konnektr products (Graph, Flow, Assembler, Compass) with descriptions and documentation links.
   - Each product card should have a "Get Started" or "Create Resource" button.

2. **Authentication Flow**

   - If the user is not authenticated, clicking "Create Resource" should redirect to login.
   - After login, redirect to project selection if no project is selected.
   - If a project is selected, redirect to the resource creation page:
     `/projects/{projectId}/resources/create?resourceType={type}&tier={tier}`

3. **Tier Selection**

   - The homepage may optionally allow pre-selecting a tier (SKU) for the resource type.
   - Pass the selected tier as a query parameter in the redirect URL.

4. **Resource Creation Page**
   - The resource creation page will use the query parameters to pre-select the resource type and tier.
   - The user completes configuration and submits the form to create the resource.

## Example Redirects

- `/projects/123/resources/create?resourceType=Konnektr.Graph&tier=standard`
- `/projects/456/resources/create?resourceType=Konnektr.Assembler&tier=free`

## Notes

- Remove the CatalogPage from the KtrlPlane frontend; all product discovery should be handled by the homepage.
- Ensure consistency with authentication and project selection flows.
- Update documentation links and product names as needed.

---

For further details, see `.github/DEVELOPMENT_PLAN.md` and `.github/copilot-instructions.md`.
