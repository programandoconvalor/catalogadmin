# Firestore multi-tenant data architecture

This document is the implementation standard for CRUD data owned by a
florist tenant. Every client-side reference must start from the authenticated
tenant in `TenantContextService`; a form value, route parameter, or URL is not
an authorization source.

## Tenant isolation and authorization

The current membership flow resolves `userTenants/{uid}`, validates the active
tenant, and exposes the selected `tenantId` through `TenantContextService`.
Services must reject operations when that context is empty and construct
references in the form:

```text
tenants/{TenantContextService.tenantId}/{collection}/{documentId}
```

Firestore rules independently check authentication, active `userTenants`
membership, tenant ownership, and role. A UI guard or a tenant-scoped client
reference alone is not authorization. The current role policy is:

| Operation | Roles |
| --- | --- |
| Read tenant-owned records | owner, admin, editor, viewer |
| Create, edit, or delete commercial records | owner, admin, editor |
| Change tenant administration or membership | owner/admin rules for that resource |

Never let a tenant member write `userTenants`, choose another tenant ID, or
change their own role. Deploy and validate `firestore.rules.corrected.txt`
before deploying a client that depends on a new collection.

## Categories: existing reference and limits

`CategoryService` obtains the active tenant from `TenantContextService` and
uses `tenants/{tenantId}/categories`. It filters reads by `catalogId == normal`,
creates documents with Firestore-generated IDs, and updates/deletes a
tenant-scoped document after checking it exists and belongs to the Normal
catalog. Create and update timestamps use `serverTimestamp()`.

The service caches by tenant and catalog for 15 seconds, reuses concurrent
loads, and invalidates the tenant's cache after mutations. It validates the
Normal catalog and non-empty document IDs. Rules provide the final tenant,
role, and catalog checks; component validation is not a security boundary.

The current category query has no `limit`, cursor, or `orderBy`; it downloads
all Normal categories and sorts them in memory. The component's page controls
therefore paginate only the downloaded array. This is acceptable only while
category counts remain small. For an unbounded collection, introduce a
server-page API using `where('catalogId', '==', 'normal')`,
`orderBy('sortOrder')`, `limit(pageSize)`, and `startAfter(lastSnapshot)`.
That compound query may require a Firestore composite index; retain the
catalog filter and add the index rather than removing the filter. Review the
category deletion/product-reference check separately before changing that
workflow.

## Social networks: independent documents

The source of truth is:

```text
tenants/{tenantId}/socials/{socialId}
```

New records use the platform's natural key (`facebook`, `instagram`,
`whatsapp`, `tiktok`, or `youtube`) as their document ID. The existing
`tenants/{tenantId}/socials/socials` record is also supported: its `network`
field identifies the platform, while its Firestore document ID remains
`socials`. CRUD operations retain the existing document ID. Documents contain
`catalogId: "normal"`, `network`, `url`, `sortOrder`, `status`, `createdAt`,
and `updatedAt`.

`SocialNetworkService` builds every reference from the active tenant. Its
read filters by catalog ID and is limited to six records: the fixed platform
set caps each catalog at five, and the extra record detects corrupted or
out-of-policy data. Results are ordered in memory. A Firestore cursor is
intentionally not used for a collection with a hard five-record maximum. If
that product cap is removed, replace this bounded list contract with
cursor-based pages (`orderBy`, `limit`, `startAfter`) before allowing growth.

Reads use a tenant-keyed 15-second cache and coalesce concurrent requests.
The cache is cleared on tenant-context changes, invalidated after successful
mutations, and protected against an older in-flight read repopulating it after
a write. Create and update transactions read the five platform IDs and the
legacy `socials` ID before writing, so duplicate platforms and unique sort
order are checked against concurrent changes. Create/update/delete
transactions access only documents under the current tenant.

The Firestore rules validate the tenant and role, allowed fields, platform
URL, status, order, and timestamps. Creates require the deterministic
platform ID; the existing `socials` ID is allowed for reading and updating
its already-created record. The rules check uniqueness across the five
platform IDs and the `socials` ID in the final transaction state. Deploy and
validate the updated rules before using CRUD against a project whose
published rules predate this compatibility case.

The catalog equality filter uses Firestore's automatic single-field index;
no composite index is required. No collection-wide reads across tenants are
used.

## Migration from `settings/storeProfile.socials`

The legacy array is retained as a read-compatible field in the profile model,
but it is no longer written by the social-network CRUD service. The profile
preview reads the independent documents. If that query fails, it reports a
warning and temporarily displays legacy data. An empty successful query is
treated as an empty collection; this avoids resurrecting old links after the
last independent document is intentionally deleted.

There is no Firebase Admin SDK, Firebase CLI configuration, or emulator
configured in this repository. Do not run a migration automatically from
Angular or with client credentials. Use the administrative script from a
secured Node 22 workspace with `firebase-admin` installed there (do not add
the Admin SDK to the browser application's dependencies). Copy
`scripts/migrate-social-networks.cjs` to that workspace and use Application
Default Credentials authorized only for the target Firebase project:

```powershell
New-Item -ItemType Directory -Force C:\secure-social-migration | Out-Null
Copy-Item .\scripts\migrate-social-networks.cjs C:\secure-social-migration\
Set-Location C:\secure-social-migration
npm init -y
npm install firebase-admin
# Authenticate using the organization's approved ADC procedure first.
$env:FIREBASE_PROJECT_ID = "catalogosflorerias"
node .\migrate-social-networks.cjs --tenant=cielitodeflores
node .\migrate-social-networks.cjs --tenant=cielitodeflores --apply
```

The first command is read-only. Review its counts before running the second.
Always pass the tenant ID explicitly when migrating a specific tenant.
The script pages tenant documents in batches, validates each legacy record,
does not overwrite conflicting independent documents, is safe to rerun, and
does not delete or rewrite the original `socials` array. The apply run verifies
that each migrated document's values and timestamps match the source, and
that the resulting collection count equals the source array count. Stop and
resolve any reported conflict; do not delete the source array as part of this
migration. Pause legacy social-network writes and tenant provisioning while
the apply run is in progress, then resume only after the verification output
is retained.

Before release:

1. Back up/export the target Firestore database and confirm the project ID.
2. Deploy the reviewed `firestore.rules.corrected.txt` rules through the
   project's authorized Firebase deployment workflow.
3. Run the migration in dry-run mode and review all tenant/error counts.
4. Run with `--apply` and retain the output for audit.
5. Confirm the per-tenant source/document counts and the profile preview.
6. Deploy the app only after rules and migrated data are verified.

`firebase.json` points Firestore deployment at
`firestore.rules.corrected.txt`. This makes the file the configured deployment
source; it does not mean the rules have already been deployed. Validate them
in a Firebase Emulator Suite and deploy through the authorized Firebase
workflow before relying on them in production.

## Adding a future CRUD collection

For each new resource:

1. Define a domain model and input type in `core/models`; use Firestore
   automatic IDs for ordinary entities and a deterministic ID only for a
   natural unique key.
2. Create a specialized service that obtains the tenant only from
   `TenantContextService`, validates input, and scopes all references beneath
   `tenants/{tenantId}`.
3. Decide and document maximum cardinality, query ordering, pagination,
   cache ownership/TTL, concurrent-request reuse, and invalidation. Do not
   paginate a large collection in component memory.
4. Use `serverTimestamp()` for create/update dates. Use a transaction or batch
   only when multiple related documents must change atomically or concurrent
   uniqueness/capacity checks must be protected.
5. Add explicit Firestore rules for tenant membership, roles, IDs, field
   validation, and immutable ownership fields. Keep rule read costs in mind.
6. Test validation, CRUD success/failure, tenant isolation, concurrent
   uniqueness/capacity, cache invalidation, and pagination. Prefer the
   Firebase Emulator Suite for rules and Firestore integration tests; do not
   test destructive mutations against production data.
7. Document any required indexes and deploy security rules before enabling
   client writes.
