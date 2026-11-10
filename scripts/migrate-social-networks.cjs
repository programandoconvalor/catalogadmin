#!/usr/bin/env node
'use strict';

const { applicationDefault, initializeApp } = require('firebase-admin/app');
const {
  FieldValue,
  FieldPath,
  Timestamp,
  getFirestore,
} = require('firebase-admin/firestore');

const CATALOG_ID = 'normal';
const NETWORK_HOSTS = {
  facebook: ['facebook.com'],
  instagram: ['instagram.com'],
  whatsapp: ['wa.me', 'whatsapp.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
};
const MAX_NETWORKS = 5;
const TENANT_BATCH_SIZE = 100;
const APPLY = process.argv.includes('--apply');
const targetTenantId = process.argv
  .find((argument) => argument.startsWith('--tenant='))
  ?.slice(9);
const projectId =
  process.env.FIREBASE_PROJECT_ID ??
  process.argv.find((argument) => argument.startsWith('--project='))?.slice(10);

function assertProjectId() {
  if (!projectId?.trim()) {
    throw new Error(
      'Define FIREBASE_PROJECT_ID o indica --project=<project-id> antes de continuar.',
    );
  }
}

function normalizeLegacyNetworks(value, tenantId) {
  if (!Array.isArray(value)) {
    throw new Error(`El campo socials no es un arreglo en el tenant ${tenantId}.`);
  }
  if (value.length > MAX_NETWORKS) {
    throw new Error(`El tenant ${tenantId} supera el límite de cinco redes.`);
  }

  const usedNetworks = new Set();
  const usedOrders = new Set();
  const normalized = value.map((entry, index) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`Registro ${index + 1} inválido en el tenant ${tenantId}.`);
    }

    const network = entry.network;
    if (!Object.hasOwn(NETWORK_HOSTS, network) || usedNetworks.has(network)) {
      throw new Error(
        `Plataforma no válida o duplicada en el tenant ${tenantId}.`,
      );
    }
    usedNetworks.add(network);

    const urlValue = entry.url;
    if (typeof urlValue !== 'string' || !urlValue.trim() || urlValue.length > 2048) {
      throw new Error(`URL inválida en el tenant ${tenantId}.`);
    }

    let url;
    try {
      url = new URL(urlValue.trim());
    } catch {
      throw new Error(`URL inválida en el tenant ${tenantId}.`);
    }
    const validHost = NETWORK_HOSTS[network].some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    );
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.port ||
      !validHost
    ) {
      throw new Error(`La URL no corresponde a ${network} en ${tenantId}.`);
    }

    const status = entry.status ?? 'active';
    if (status !== 'active' && status !== 'inactive') {
      throw new Error(`Estado inválido en el tenant ${tenantId}.`);
    }

    const sortOrder = entry.sortOrder ?? null;
    if (
      sortOrder !== null &&
      (!Number.isSafeInteger(sortOrder) || sortOrder < 1 || usedOrders.has(sortOrder))
    ) {
      throw new Error(`Orden inválido o duplicado en el tenant ${tenantId}.`);
    }
    if (sortOrder !== null) usedOrders.add(sortOrder);

    if (
      entry.createdAt !== undefined &&
      entry.createdAt !== null &&
      !(entry.createdAt instanceof Timestamp)
    ) {
      throw new Error(`createdAt no es Timestamp en el tenant ${tenantId}.`);
    }

    return {
      catalogId: CATALOG_ID,
      network,
      url: urlValue.trim(),
      sortOrder,
      status,
      createdAt: entry.createdAt ?? undefined,
    };
  });

  for (const network of normalized) {
    if (network.sortOrder === null) {
      let nextOrder = 1;
      while (usedOrders.has(nextOrder)) nextOrder += 1;
      network.sortOrder = nextOrder;
      usedOrders.add(nextOrder);
    }
  }

  return normalized;
}

function matchesExistingDocument(document, network) {
  const data = document.data();
  return (
    data.network === network.network &&
    data.url === network.url &&
    data.sortOrder === network.sortOrder &&
    data.status === network.status
  );
}

async function migrateTenant(db, tenantId) {
  const profileRef = db.doc(`tenants/${tenantId}/settings/storeProfile`);
  const socialsRef = db.collection(`tenants/${tenantId}/socials`);
  const migratedCount = await db.runTransaction(async (transaction) => {
    const [profileSnapshot, socialsSnapshot] = await Promise.all([
      transaction.get(profileRef),
      transaction.get(socialsRef),
    ]);

    const source = profileSnapshot.exists
      ? profileSnapshot.get('socials')
      : [];
    if (source === undefined) {
      return {
        sourceCount: 0,
        createdCount: 0,
        skippedCount: 1,
        metadataUpdatedCount: 0,
      };
    }

    const networks = normalizeLegacyNetworks(source, tenantId);
    const existing = new Map(
      socialsSnapshot.docs.map((document) => [document.id, document]),
    );

    for (const network of networks) {
      const current = existing.get(network.network);
      if (
        current &&
        (!matchesExistingDocument(current, network) ||
          (current.get('catalogId') !== undefined &&
            current.get('catalogId') !== CATALOG_ID))
      ) {
        throw new Error(
          `Conflicto en tenants/${tenantId}/socials/${network.network}; no se sobrescribió.`,
        );
      }
    }

    let createdCount = 0;
    let skippedCount = 0;
    let metadataUpdatedCount = 0;
    if (APPLY) {
      for (const network of networks) {
        const documentRef = socialsRef.doc(network.network);
        const current = existing.get(network.network);
        if (current) {
          skippedCount += 1;
          const currentData = current.data();
          const updates = {};
          if (currentData.catalogId === undefined) {
            updates.catalogId = CATALOG_ID;
          }
          if (!(currentData.createdAt instanceof Timestamp)) {
            updates.createdAt = network.createdAt ?? FieldValue.serverTimestamp();
          }
          if (!(currentData.updatedAt instanceof Timestamp)) {
            updates.updatedAt = FieldValue.serverTimestamp();
          }
          if (Object.keys(updates).length) {
            transaction.update(documentRef, updates);
            metadataUpdatedCount += 1;
          }
          continue;
        }

        createdCount += 1;
        transaction.create(documentRef, {
          catalogId: CATALOG_ID,
          network: network.network,
          url: network.url,
          sortOrder: network.sortOrder,
          status: network.status,
          createdAt: network.createdAt ?? FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      createdCount = networks.filter(
        ({ network }) => !existing.has(network),
      ).length;
      skippedCount = networks.length - createdCount;
    }

    return {
      sourceCount: networks.length,
      createdCount,
      skippedCount,
      metadataUpdatedCount,
    };
  });

  if (!APPLY) {
    return { ...migratedCount, documentCount: null };
  }

  const profileSnapshot = await profileRef.get();
  const expected = normalizeLegacyNetworks(
    profileSnapshot.exists ? profileSnapshot.get('socials') ?? [] : [],
    tenantId,
  );
  const migrated = await socialsRef.get();
  for (const network of expected) {
    const document = migrated.docs.find(({ id }) => id === network.network);
    if (
      !document ||
      document.get('catalogId') !== CATALOG_ID ||
      !matchesExistingDocument(document, network) ||
      !(document.get('createdAt') instanceof Timestamp) ||
      !(document.get('updatedAt') instanceof Timestamp)
    ) {
      throw new Error(
        `La verificación falló para tenants/${tenantId}/socials/${network.network}.`,
      );
    }
  }
  if (migrated.size !== expected.length) {
    throw new Error(`Conteo migrado inconsistente para el tenant ${tenantId}.`);
  }

  return {
    ...migratedCount,
    sourceCount: expected.length,
    documentCount: expected.length,
  };
}

async function main() {
  assertProjectId();
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  const db = getFirestore();
  const tenants = db.collection('tenants');
  let lastTenant = null;
  let scanned = 0;
  const report = {
    tenantsScanned: 0,
    sourceRecords: 0,
    recordsCreated: 0,
    recordsSkipped: 0,
    recordsVerified: 0,
    metadataUpdated: 0,
    errors: [],
  };

  while (true) {
    let tenantsQuery = tenants.orderBy(FieldPath.documentId());
    if (targetTenantId) {
      tenantsQuery = tenantsQuery.where(
        FieldPath.documentId(),
        '==',
        targetTenantId,
      );
    }
    tenantsQuery = tenantsQuery.limit(
      targetTenantId ? 1 : TENANT_BATCH_SIZE,
    );
    if (lastTenant) tenantsQuery = tenantsQuery.startAfter(lastTenant);

    const page = await tenantsQuery.get();
    if (page.empty) break;

    for (const tenant of page.docs) {
      report.tenantsScanned += 1;
      try {
        const result = await migrateTenant(db, tenant.id);
        report.sourceRecords += result.sourceCount;
        report.recordsCreated += result.createdCount;
        report.recordsSkipped += result.skippedCount;
        report.metadataUpdated += result.metadataUpdatedCount;
        if (result.documentCount !== null) {
          report.recordsVerified += result.documentCount;
          console.info(
            `Verificado tenant ${report.tenantsScanned}: ${result.documentCount}/${result.sourceCount} redes.`,
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error);
        report.errors.push({ tenantId: tenant.id, message });
        console.error(`Tenant ${tenant.id}: ${message}`);
      }
    }

    lastTenant = page.docs[page.docs.length - 1];
    if (page.size < TENANT_BATCH_SIZE) break;
  }

  if (targetTenantId && report.tenantsScanned === 0) {
    throw new Error(`No existe el tenant "${targetTenantId}" en Firestore.`);
  }

  console.info(`${APPLY ? 'Migración' : 'Simulación'} finalizada:`);
  console.info(JSON.stringify(report, null, 2));
  if (!APPLY) {
    console.info('No se escribieron documentos. Repite con --apply para migrar.');
  }
  if (report.errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Migración detenida sin eliminar datos de origen:', error);
  process.exitCode = 1;
});
