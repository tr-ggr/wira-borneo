# @wira-borneo/api-client

Generated typed API client from the NestJS OpenAPI document.

The generated output now includes TanStack React Query hooks and query option helpers.

## Generate

```sh
npm run generate -w @wira-borneo/api-client
```

## How It Works

- `openapi:sync` downloads `http://localhost:3333/api/openapi.json` into `openapi/openapi.json`.
- `generate` runs sync first, then runs Orval to produce `src/generated/api-client.ts` with:
	- Typed request functions (Axios transport)
	- Typed TanStack React Query hooks (`use*`)
	- Query key and query option helpers (`get*QueryKey`, `get*QueryOptions`)

Override API URL when needed:

```sh
$env:API_OPENAPI_URL="http://localhost:3333/api/openapi.json"; npm run generate -w @wira-borneo/api-client
```

## Ownership And Update Workflow

- Source of truth: NestJS controllers/DTO Swagger metadata in `apps/api`.
- Generated file ownership: `src/generated/api-client.ts` is generated output; do not hand-edit.
- To update after API changes:
	1. Ensure API is running (`npm run dev:api`).
	2. Regenerate (`npm run api:client:generate`).
	3. Commit generated diff with related API change.

## React Query Usage

Install requirement for consumers:

```sh
npm install @tanstack/react-query
```

Wrap your app with a `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Use generated hooks from the package root:

```tsx
import { useAppControllerGetData } from '@wira-borneo/api-client';

export function Example() {
	const { data, isLoading, error } = useAppControllerGetData();

	if (isLoading) return <p>Loading...</p>;
	if (error) return <p>Failed to load</p>;

	return <p>{data?.data.message}</p>;
}
```

## Migration Notes (Axios -> React Query)

- Prefer importing hooks and helpers from `@wira-borneo/api-client` instead of composing manual request state around raw Axios calls.
- Existing generated request functions remain available and can be used for imperative flows while screens migrate.
- Do not import from internal paths like `@wira-borneo/api-client/src/generated`.
- Suggested follow-up adoption work:
	1. `apps/admin`: replace custom loading/error state in API-consuming components with generated hooks.
	2. `apps/tracker`: migrate endpoint-by-endpoint using generated query keys for cache invalidation consistency.
	3. `apps/mobile` (web/native surfaces): adopt generated hooks where TanStack React Query provider is already available or added.
