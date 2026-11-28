'use strict';

const dbrain = require('../../packages/dbrain/lib/dbrain-core.js');
const dthalamus = require('../../packages/dthalamus/lib/dthalamus-core.js');
const dolfactory = require('../../packages/dolfactory/lib/dolfactory-core.js');

const DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL = dbrain.DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL;
const VALID_SPO_MODALITIES = dbrain.VALID_SPO_MODALITIES;
const PROVENANCE_STAGE_WEIGHTS = dbrain.PROVENANCE_STAGE_WEIGHTS;

function candidateMatchesMissingDomain(candidate, missingSpecs, uncoveredConcepts) {
  const titleText = String(candidate.title ?? '');
  const summaryText = String(candidate.summary ?? '');
  const rawSpecs =
    Array.isArray(candidate.specializations) && candidate.specializations.length > 0
      ? candidate.specializations
      : dolfactory.sniffSpecializationOdors(`${titleText} ${summaryText}`).detectedSpecializations;
  const specMatched = missingSpecs.some((sp) => {
    const rootPrefix = sp.split('/')[0];
    return rawSpecs.some(
      (cs) =>
        cs === sp ||
        cs.startsWith(`${sp}/`) ||
        sp.startsWith(`${cs}/`) ||
        (rootPrefix !== 'spec:universal' && cs.startsWith(`${rootPrefix}/`))
    );
  });
  if (specMatched) return true;
  const hay = `${titleText} ${summaryText}`.toLowerCase();
  return uncoveredConcepts.some((concept) => concept.length >= 4 && hay.includes(concept));
}

function createNousgentEpistemicGovernor() {
  let ontologyCoverageChecks = 0;
  let ontologyReconciliations = 0;
  let provenanceGradings = 0;
  let bibaEpistemicDemotions = 0;
  let withheldBystanderCapsules = 0;

  function evaluateQueryCoverageWithOrderbook({
    query = '',
    symbols = [],
    capsules = [],
    orderbookCandidates = []
  } = {}) {
    ontologyCoverageChecks += 1;
    const safeSymbols = Array.isArray(symbols) ? symbols.slice(0, 64) : [];
    const safeCapsules = Array.isArray(capsules) ? capsules.slice(0, 512) : [];
    const coverage = dbrain.evaluateEpistemicQueryCoverage({
      query: String(query),
      symbols: safeSymbols,
      capsules: safeCapsules,
      ontology: dbrain.DEFAULT_CORTICAL_ONTOLOGY_CONTRACT
    });

    const pool = Array.isArray(orderbookCandidates) ? orderbookCandidates : [];
    const orderbookRecommendations =
      coverage.uncoveredConcepts.length > 0
        ? pool
            .filter((cand) =>
              candidateMatchesMissingDomain(
                cand,
                coverage.inferredMissingSpecializations,
                coverage.uncoveredConcepts
              )
            )
            .slice(0, 3)
            .map((cand) => {
              const priceDig = String(cand.priceDig ?? '25.000');
              return Object.freeze({
                capsuleId: String(cand.capsuleId ?? cand.id ?? ''),
                title: String(cand.title ?? ''),
                lobe: String(cand.lobe ?? 'procedural'),
                priceDig,
                priceDigFormatted: String(cand.priceDigFormatted ?? `${priceDig} $DIG`),
                estimatedGainPct: Number(cand.estimatedGainPct ?? 0.25),
                specializations: Array.isArray(cand.specializations) ? cand.specializations : []
              });
            })
        : [];

    return Object.freeze({
      ...coverage,
      hasOrderbookMatch: orderbookRecommendations.length > 0,
      orderbookRecommendations: Object.freeze(orderbookRecommendations)
    });
  }

  function reconcileOntologyEntitiesAndPredicates({
    entity = null,
    existingEntities = [],
    entityDegrees = null,
    triples = []
  } = {}) {
    ontologyReconciliations += 1;
    const safeEntities = Array.isArray(existingEntities) ? existingEntities.slice(0, 512) : [];
    const safeTriples = Array.isArray(triples) ? triples.slice(0, 256) : [];

    let entityResolution = null;
    if (entity) {
      const normalizedEntity =
        typeof entity === 'string'
          ? { name: entity, type: 'Service' }
          : { name: String(entity.name ?? ''), type: String(entity.type ?? 'Service'), aliases: entity.aliases };
      entityResolution = dbrain.resolveCanonicalEntityAlias({
        entity: normalizedEntity,
        existingEntities: safeEntities,
        entityDegrees
      });
    }

    const predicateReconciliation = dbrain.reconcileSubjectPredicates({
      triples: safeTriples,
      ontology: dbrain.DEFAULT_CORTICAL_ONTOLOGY_CONTRACT
    });

    return Object.freeze({
      protocol: DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL,
      entityResolution,
      predicateReconciliation
    });
  }

  function normalizeTeachEpistemicPayload({
    content = '',
    spoTriples = [],
    tags = [],
    bibaTainted = false,
    trustedHostOracle = false
  } = {}) {
    const isBibaDemoted = Boolean(bibaTainted && !trustedHostOracle);
    if (isBibaDemoted) {
      bibaEpistemicDemotions += 1;
    }

    const seedTriples =
      Array.isArray(spoTriples) && spoTriples.length > 0
        ? spoTriples.slice(0, 32)
        : [{ subject: 'NOUSGENT', predicate: 'ASSERTS_INVARIANT', object: String(content) }];

    const normalizedTriples = seedTriples.map((triple) =>
      Object.freeze({
        subject: String(triple.subject ?? 'NOUSGENT'),
        predicate: String(triple.predicate ?? 'ASSERTS_INVARIANT'),
        object: String(triple.object ?? content),
        modality: dbrain.inferSpoEpistemicModality(triple, {
          bibaTainted: isBibaDemoted,
          trustedHostOracle: Boolean(trustedHostOracle)
        })
      })
    );

    const baseTags = Array.isArray(tags) ? tags.map((t) => String(t)) : [];
    if (isBibaDemoted && !baseTags.includes('biba:epistemic-demoted')) {
      baseTags.push('biba:epistemic-demoted');
    }

    return Object.freeze({
      inferredModality: normalizedTriples[0].modality,
      epistemicModalityClamped: isBibaDemoted ? 'proposed' : null,
      spoTriples: Object.freeze(normalizedTriples),
      tags: Object.freeze(baseTags)
    });
  }

  function gradeEpisodeProvenanceAndRoyalties({
    recalledCapsules = [],
    touchedFiles = [],
    referencedSymbols = [],
    executedCommands = [],
    modHashes = [],
    sensorVerified = false,
    exitCode = 0
  } = {}) {
    provenanceGradings += 1;
    const graded = dthalamus.gradeRing0EpisodeProvenance({
      recalledCapsules: Array.isArray(recalledCapsules) ? recalledCapsules.slice(0, 16) : [],
      touchedFiles: Array.isArray(touchedFiles) ? touchedFiles.slice(0, 64) : [],
      referencedSymbols: Array.isArray(referencedSymbols) ? referencedSymbols.slice(0, 64) : [],
      executedCommands: Array.isArray(executedCommands) ? executedCommands.slice(0, 16) : [],
      modHashes: Array.isArray(modHashes) ? modHashes.slice(0, 16) : [],
      sensorVerified: Boolean(sensorVerified),
      exitCode: Number(exitCode)
    });
    const royaltyGate = dbrain.filterRoyaltyEligibleProvenance(graded.grades);
    withheldBystanderCapsules += royaltyGate.withheldBystanderCapsuleIds.length;

    return Object.freeze({
      status: 'graded',
      ...graded,
      royaltyGate
    });
  }

  function getStats() {
    return Object.freeze({
      protocol: DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL,
      validModalities: VALID_SPO_MODALITIES,
      stageWeights: PROVENANCE_STAGE_WEIGHTS,
      royaltyFloorStage: 'REFERENCED',
      ontologyCoverageChecks,
      ontologyReconciliations,
      provenanceGradings,
      bibaEpistemicDemotions,
      withheldBystanderCapsules
    });
  }

  return Object.freeze({
    evaluateQueryCoverageWithOrderbook,
    reconcileOntologyEntitiesAndPredicates,
    normalizeTeachEpistemicPayload,
    gradeEpisodeProvenanceAndRoyalties,
    getStats
  });
}

module.exports = Object.freeze({
  DBRAIN_EPISTEMIC_ONTOLOGY_PROTOCOL,
  VALID_SPO_MODALITIES,
  PROVENANCE_STAGE_WEIGHTS,
  createNousgentEpistemicGovernor
});
