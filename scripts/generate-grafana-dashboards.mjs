#!/usr/bin/env node
/**
 * Deterministic Generator for the 5 Split-Out dbrain & NOUSGENT Grafana 11 SOC Dashboards:
 *   1. grafana-01-dolfactory-soc-dashboard.json  (uid: dolfactory-cn1-soc-v2)
 *   2. grafana-02-dthalamus-soc-dashboard.json   (uid: dthalamus-ring0-soc-v2)
 *   3. grafana-03-dbrain-soc-dashboard.json      (uid: dbrain-cortex-soc-v2)
 *   4. grafana-04-liquidish-soc-dashboard.json   (uid: liquidish-dex-soc-v2)
 *   5. grafana-nousgent-soc-dashboard.json       (uid: nousgent-cleanroom-soc-v1)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const OBS_DIRS = [
  path.join(REPO_ROOT, 'deploy/resources/observability'),
  path.join(REPO_ROOT, '.agent/skills/nousgent-deployer/resources/observability')
];

const DS_PROM = { type: 'prometheus', uid: 'DS_PROMETHEUS' };
const SHARED_SOC_TAG = 'dbrain-five-organ-soc';

const CROSS_DASHBOARD_LINKS = [
  {
    title: '5-Organ Stack Dashboards',
    type: 'dashboards',
    tags: [SHARED_SOC_TAG],
    asDropdown: false,
    icon: 'apps',
    includeVars: true,
    keepTime: true,
    targetBlank: false
  }
];

function createPanelBuilder() {
  let nextId = 1;
  let yCursor = 0;
  const panels = [];

  function addRow(title) {
    panels.push({
      id: nextId++,
      type: 'row',
      title,
      collapsed: false,
      gridPos: { h: 1, w: 24, x: 0, y: yCursor }
    });
    yCursor += 1;
  }

  function addRowPanels(height, defs) {
    let x = 0;
    for (const def of defs) {
      const w = def.w;
      const targets = def.targets.map((t, idx) => ({
        datasource: DS_PROM,
        expr: t.expr,
        legendFormat: t.legend || '__auto',
        refId: String.fromCharCode(65 + idx),
        ...(t.format ? { format: t.format } : {})
      }));

      const thresholds = def.thresholds || [
        { color: 'green', value: null }
      ];

      const panel = {
        id: nextId++,
        type: def.type,
        title: def.title,
        description: def.description || '',
        datasource: DS_PROM,
        gridPos: { h: height, w, x, y: yCursor },
        targets,
        fieldConfig: {
          defaults: {
            unit: def.unit || 'short',
            ...(def.decimals !== undefined ? { decimals: def.decimals } : {}),
            ...(def.min !== undefined ? { min: def.min } : {}),
            ...(def.max !== undefined ? { max: def.max } : {}),
            color: def.colorMode
              ? { mode: def.colorMode, ...(def.fixedColor ? { fixedColor: def.fixedColor } : {}) }
              : { mode: def.type === 'timeseries' || def.type === 'piechart' ? 'palette-classic' : 'thresholds' },
            thresholds: {
              mode: 'absolute',
              steps: thresholds
            },
            ...(def.mappings ? { mappings: def.mappings } : {}),
            ...(def.type === 'timeseries'
              ? {
                  custom: {
                    drawStyle: def.drawStyle || 'line',
                    lineInterpolation: 'smooth',
                    lineWidth: 2,
                    fillOpacity: def.fillOpacity ?? 18,
                    gradientMode: 'opacity',
                    showPoints: 'never',
                    stacking: { mode: def.stack ? 'normal' : 'none', group: 'A' }
                  }
                }
              : {})
          },
          overrides: []
        },
        options: buildPanelOptions(def)
      };

      panels.push(panel);
      x += w;
    }
    yCursor += height;
  }

  return { addRow, addRowPanels, panels };
}

function buildPanelOptions(def) {
  if (def.type === 'stat') {
    return {
      reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' },
      orientation: 'auto',
      textMode: 'auto',
      colorMode: def.statBg ? 'background_solid' : 'value',
      graphMode: def.sparkline === false ? 'none' : 'area',
      justifyMode: 'auto'
    };
  }
  if (def.type === 'gauge') {
    return {
      reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' },
      orientation: 'auto',
      showThresholdLabels: false,
      showThresholdMarkers: true
    };
  }
  if (def.type === 'bargauge') {
    return {
      reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' },
      orientation: def.orientation || 'horizontal',
      displayMode: 'gradient',
      valueMode: 'color',
      showUnfilled: true
    };
  }
  if (def.type === 'piechart') {
    return {
      reduceOptions: { values: false, calcs: ['lastNotNull'], fields: '' },
      pieType: 'donut',
      displayLabels: ['percent'],
      legend: { displayMode: 'table', placement: 'right', values: ['value', 'percent'] },
      tooltip: { mode: 'multi', sort: 'desc' }
    };
  }
  if (def.type === 'state-timeline') {
    return {
      mergeValues: true,
      showValue: 'auto',
      alignValue: 'center',
      rowHeight: 0.85,
      legend: { displayMode: 'list', placement: 'bottom', showLegend: true },
      tooltip: { mode: 'single', sort: 'none' }
    };
  }
  if (def.type === 'heatmap') {
    return {
      calculate: false,
      yAxis: { unit: def.unit || 's' },
      color: { mode: 'scheme', scheme: 'Spectral', steps: 64, exponent: 0.5 },
      cellGap: 1,
      legend: { show: true },
      tooltip: { show: true, yHistogram: true }
    };
  }
  return {
    legend: { displayMode: 'table', placement: 'bottom', showLegend: true, calcs: ['lastNotNull', 'max'] },
    tooltip: { mode: 'multi', sort: 'desc' }
  };
}

function wrapDashboard({ uid, title, description, tags, panels }) {
  return {
    uid,
    title,
    description,
    tags: [SHARED_SOC_TAG, ...tags],
    timezone: 'browser',
    schemaVersion: 39,
    version: 2,
    refresh: '15s',
    time: { from: 'now-1h', to: 'now' },
    editable: false,
    graphTooltip: 1,
    links: CROSS_DASHBOARD_LINKS,
    panels
  };
}

const UP_DOWN_MAPPINGS = [
  {
    type: 'value',
    options: {
      '0': { text: 'DOWN', color: 'red', index: 0 },
      '1': { text: 'LIVE', color: 'green', index: 1 }
    }
  }
];

const PASS_FAIL_MAPPINGS = [
  {
    type: 'value',
    options: {
      '0': { text: 'FAIL', color: 'red', index: 0 },
      '1': { text: 'PASS', color: 'green', index: 1 }
    }
  }
];

// ============================================================================
// 01 // dolfactory.to — Cranial Nerve I Pre-Thalamic Olfactory SOC
// ============================================================================
function buildDolfactoryDashboard() {
  const b = createPanelBuilder();

  b.addRow('Row 1 — Cranial Nerve I Availability, OR-001..OR-012 Cartridges & Cribriform Latency');
  b.addRowPanels(4, [
    {
      w: 4,
      type: 'stat',
      title: 'CN-I Replicas Online',
      description: 'Live dolfactory-web HPA pods scraped via Headless DNS SD.',
      targets: [{ expr: 'sum(up{job=~"dolfactory.*"})', legend: 'Pods Up' }],
      thresholds: [{ color: 'red', value: null }, { color: 'yellow', value: 1 }, { color: 'green', value: 2 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Configured OR Cartridges (OR-001..012)',
      description: 'Total receptor cartridges including homeostasis (OR-009..010), sponge (OR-011), and SEP-2640 skill guard (OR-012).',
      targets: [{ expr: 'max(nousgent_dolfactory_total_receptors) or sum(max by (mode) (dolfactory_active_receptors{job=~"dolfactory.*"}))', legend: 'Total ORs' }],
      thresholds: [{ color: 'yellow', value: null }, { color: 'green', value: 12 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Tufted Inline IPS vs Shadow IDS',
      description: 'Active inline IPS quarantine cartridges vs out-of-band Mitral shadow tap cartridges.',
      targets: [
        { expr: 'max(dolfactory_active_receptors{job=~"dolfactory.*",mode="IPS_INLINE"})', legend: 'IPS Inline' },
        { expr: 'max(dolfactory_active_receptors{job=~"dolfactory.*",mode="IDS_TAP_SHADOW"})', legend: 'Shadow IDS' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Conditioned Piriform Odors',
      description: 'Active one-trial 2,048-KC Fly-LSH conditioned aversion memories.',
      targets: [{ expr: 'max(nousgent_dolfactory_imprinted_odors)', legend: 'Imprinted Odors' }],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 4,
      type: 'gauge',
      title: 'Inline Sniff P99 Latency',
      description: '99th-percentile inline Cribriform sniff duration (fail-closed cartridge budget <= 0.25ms; SLO <= 2ms).',
      unit: 's',
      min: 0,
      max: 0.005,
      decimals: 4,
      targets: [{ expr: 'histogram_quantile(0.99, sum by (le) (rate(dolfactory_sniff_duration_seconds_bucket{job=~"dolfactory.*"}[5m])))', legend: 'p99' }],
      thresholds: [{ color: 'green', value: null }, { color: 'yellow', value: 0.001 }, { color: 'red', value: 0.0025 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Inter-Organ Probe Latency',
      description: 'Live HTTP status probe latency from NOUSGENT to dolfactory.to.',
      unit: 'ms',
      decimals: 2,
      targets: [{ expr: 'avg(nousgent_organ_latency_ms{organ="dolfactory.to"})', legend: 'dolfactory.to' }],
      thresholds: [{ color: 'green', value: null }, { color: 'yellow', value: 25 }, { color: 'red', value: 100 }]
    }
  ]);

  b.addRow('Row 2 — Orthonasal / Retronasal Sniff Throughput, IPS Quarantines & Shadow Tap');
  b.addRowPanels(7, [
    {
      w: 9,
      type: 'timeseries',
      title: 'Pre-Thalamic Sniff Rate by Plane & Verdict',
      description: 'Frames/sec across orthonasal_ingress, retronasal_egress, and vno_gossip.',
      unit: 'ops',
      targets: [{ expr: 'sum by (plane, verdict) (rate(dolfactory_sniffs_total{job=~"dolfactory.*"}[5m]))', legend: '{{plane}} · {{verdict}}' }]
    },
    {
      w: 5,
      type: 'piechart',
      title: 'Cumulative Sniff Verdicts',
      targets: [{ expr: 'sum by (verdict) (dolfactory_sniffs_total{job=~"dolfactory.*"})', legend: '{{verdict}}' }]
    },
    {
      w: 10,
      type: 'timeseries',
      drawStyle: 'bars',
      fillOpacity: 75,
      stack: true,
      title: 'Synchronous Tufted IPS Drops by Receptor Family & Severity (5m)',
      targets: [{ expr: 'sum by (receptor_family, severity) (increase(dolfactory_ips_drops_total{job=~"dolfactory.*",receptor_family!="none"}[5m]))', legend: '{{severity}} · {{receptor_family}}' }]
    }
  ]);

  b.addRow('Row 3 — Inline Sniff Latency Distribution & 3-Tier Glomerular Split-Payload Plumes');
  b.addRowPanels(7, [
    {
      w: 8,
      type: 'heatmap',
      title: 'Cribriform Sniff Duration Heatmap',
      unit: 's',
      targets: [{ expr: 'sum by (le) (increase(dolfactory_sniff_duration_seconds_bucket{job=~"dolfactory.*"}[5m]))', legend: '{{le}}', format: 'heatmap' }]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'Inline Sniff Quantiles (p50 / p95 / p99)',
      unit: 's',
      targets: [
        { expr: 'histogram_quantile(0.50, sum by (le) (rate(dolfactory_sniff_duration_seconds_bucket{job=~"dolfactory.*"}[5m])))', legend: 'p50' },
        { expr: 'histogram_quantile(0.95, sum by (le) (rate(dolfactory_sniff_duration_seconds_bucket{job=~"dolfactory.*"}[5m])))', legend: 'p95' },
        { expr: 'histogram_quantile(0.99, sum by (le) (rate(dolfactory_sniff_duration_seconds_bucket{job=~"dolfactory.*"}[5m])))', legend: 'p99' }
      ]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'Glomerular Multi-Turn Plume Alerts & Mitral Shadow Hits (15m)',
      targets: [
        { expr: 'sum by (receptor_family) (increase(dolfactory_glomerular_plume_alerts_total{job=~"dolfactory.*"}[15m]))', legend: 'Plume · {{receptor_family}}' },
        { expr: 'sum by (receptor_family) (increase(dolfactory_ids_shadow_hits_total{job=~"dolfactory.*"}[15m]))', legend: 'Shadow · {{receptor_family}}' }
      ]
    }
  ]);

  b.addRow('Row 4 — Piriform 2,048-KC Fly-LSH Immunity, VNO East-West Guard & Dopaminergic Plasticity');
  b.addRowPanels(6, [
    {
      w: 8,
      type: 'bargauge',
      title: 'Piriform 2,048-Bit Fly-LSH Novel Odor Matches by Action',
      targets: [{ expr: 'sum by (action) (dolfactory_piriform_novel_odors_total{job=~"dolfactory.*"})', legend: '{{action}}' }],
      thresholds: [{ color: 'green', value: null }, { color: 'orange', value: 1 }, { color: 'red', value: 5 }]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'VNO East-West Pheromone, ESS1 & SEP-2640 Skill Manifest Pinning',
      targets: [
        { expr: 'sum by (reason) (increase(dolfactory_vno_pheromone_rejections_total{job=~"dolfactory.*"}[15m]))', legend: 'VNO Reject · {{reason}}' },
        { expr: 'sum(increase(nousgent_vno_skill_audits_total[15m]))', legend: 'SEP-2640 Audits' },
        { expr: 'sum(increase(nousgent_vno_skill_anomalies_total[15m]))', legend: 'SEP-2640 Anomalies' }
      ]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'Dopaminergic PAM/PPL1 & Biba-Guarded Centrifugal Modulations',
      targets: [{ expr: 'sum by (channel) (increase(dolfactory_dopamine_modulations_total{job=~"dolfactory.*"}[15m]))', legend: '{{channel}}' }]
    }
  ]);

  return wrapDashboard({
    uid: 'dolfactory-cn1-soc-v2',
    title: '01 // dolfactory.to — Cranial Nerve I Olfactory IDS/IPS, Plumes, Fly-LSH & VNO SOC',
    description: 'Dedicated pre-thalamic Cranial Nerve I telemetry across OR-001..OR-012 cartridges, 3-tier Glomerular plumes, 2,048-KC Fly-LSH Piriform memory, and VNO East-West MCP pinning.',
    tags: ['dolfactory', 'cn1', 'fly-lsh', 'vno', 'sep-2640'],
    panels: b.panels
  });
}

// ============================================================================
// 02 // dthalamus.to — Ring-0 Reference Monitor, DAN-v1.1 & 4-Layer Cache SOC
// ============================================================================
function buildDthalamusDashboard() {
  const b = createPanelBuilder();

  b.addRow('Row 1 — Ring-0 Reference Monitor Posture, Regression Ratchet & Alignment Leases');
  b.addRowPanels(4, [
    {
      w: 4,
      type: 'stat',
      title: 'Ring-0 Replicas Online',
      targets: [{ expr: 'sum(up{job=~"dthalamus.*"})', legend: 'Pods Up' }],
      thresholds: [{ color: 'red', value: null }, { color: 'yellow', value: 1 }, { color: 'green', value: 2 }]
    },
    {
      w: 4,
      type: 'stat',
      statBg: true,
      sparkline: false,
      title: 'Self-Repairing Regression Ratchet',
      mappings: PASS_FAIL_MAPPINGS,
      targets: [{ expr: 'min(nousgent_dthalamus_ratchet_passed)', legend: 'Ratchet' }],
      thresholds: [{ color: 'red', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Active Ring-0 Antibodies',
      targets: [{ expr: 'max(dthalamus_active_antibodies{job=~"dthalamus.*"})', legend: 'AB-2026-*' }],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Active Alignment Leases',
      targets: [{ expr: 'max(dthalamus_alignment_leases{job=~"dthalamus.*",state="active"})', legend: 'Active Leases' }],
      thresholds: [{ color: 'green', value: null }, { color: 'yellow', value: 500 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Tier-2 CHIP-0043 Clear-Sign Holds',
      targets: [{ expr: 'sum(dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*",outcome="held_tier2_clearsign"})', legend: '-32044 Holds' }],
      thresholds: [{ color: 'green', value: null }, { color: 'orange', value: 1 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Quarantined Adversarial Bytes',
      unit: 'bytes',
      targets: [{ expr: 'max(dthalamus_ingress_quarantine_bytes_total{job=~"dthalamus.*"})', legend: 'Quarantined' }],
      thresholds: [{ color: 'green', value: null }, { color: 'yellow', value: 65536 }, { color: 'red', value: 524288 }]
    }
  ]);

  b.addRow('Row 2 — Zero-Ingestion Sensory Shield & Efferent Reference Monitor Outcomes');
  b.addRowPanels(7, [
    {
      w: 9,
      type: 'bargauge',
      title: 'Reference Monitor Evaluations by Outcome (All 9 Ring-0 Gates)',
      targets: [{ expr: 'sum by (outcome) (dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*"})', legend: '{{outcome}}' }],
      thresholds: [{ color: 'green', value: null }, { color: 'yellow', value: 10 }, { color: 'orange', value: 100 }]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'Inbound Threats Blocked & Afferent Inspections (5m)',
      targets: [
        { expr: 'sum by (severity, threat_category) (increase(dthalamus_ingress_threats_blocked_total{job=~"dthalamus.*",threat_category!="none"}[5m]))', legend: 'Blocked · {{severity}} {{threat_category}}' },
        { expr: 'sum by (source_class, verdict) (increase(dthalamus_ingress_inspections_total{job=~"dthalamus.*"}[5m]))', legend: 'Inspect · {{source_class}}->{{verdict}}' }
      ]
    },
    {
      w: 7,
      type: 'timeseries',
      title: 'TRN Sensory Scan Latency (p50 / p95 / p99) & Relay Probe',
      unit: 's',
      targets: [
        { expr: 'histogram_quantile(0.50, sum by (le) (rate(dthalamus_ingress_scan_duration_seconds_bucket{job=~"dthalamus.*"}[5m])))', legend: 'Scan p50' },
        { expr: 'histogram_quantile(0.95, sum by (le) (rate(dthalamus_ingress_scan_duration_seconds_bucket{job=~"dthalamus.*"}[5m])))', legend: 'Scan p95' },
        { expr: 'avg(nousgent_organ_latency_ms{organ="dthalamus.to"}) / 1000', legend: 'NOUSGENT Probe' }
      ]
    }
  ]);

  b.addRow('Row 3 — Alignment Lease Lifecycle, DAN-v1.1 Dopamine RPE & SEP-2640 Skill Firewall');
  b.addRowPanels(6, [
    {
      w: 6,
      type: 'piechart',
      title: 'Alignment Leases by Lifecycle State',
      targets: [{ expr: 'max by (state) (dthalamus_alignment_leases{job=~"dthalamus.*"})', legend: '{{state}}' }]
    },
    {
      w: 9,
      type: 'timeseries',
      title: 'Ed25519 DAN-v1.1 Dopaminergic RPE Envelopes & Biba PAM Vetoes',
      targets: [
        { expr: 'sum by (channel) (increase(dthalamus_dopamine_rpe_events_total{job=~"dthalamus.*"}[15m]))', legend: '{{channel}}' },
        { expr: 'sum(increase(dthalamus_biba_pam_vetoes_total{job=~"dthalamus.*"}[15m]))', legend: 'Biba PAM Vetoes' }
      ]
    },
    {
      w: 9,
      type: 'bargauge',
      title: 'SEP-2640 Ring-0 Skill Firewall & Security Traps',
      targets: [
        { expr: 'sum(nousgent_mcp_skill_reads_total{outcome="verified"})', legend: 'SEP-2640 Skill Verified' },
        { expr: 'sum(nousgent_mcp_skill_reads_total{outcome="blocked"})', legend: 'SEP-2640 Trojan Quarantined' },
        { expr: 'sum(dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*",outcome="blocked_exfiltration"})', legend: 'Phantom Secret Exfil Blocked' },
        { expr: 'sum(dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*",outcome="held_tainted_write"})', legend: 'Biba Tainted Write Held' },
        { expr: 'sum(dthalamus_reference_monitor_evaluations_total{job=~"dthalamus.*",outcome="blocked_antibody"})', legend: 'Antibody Intercepts' }
      ],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    }
  ]);

  b.addRow('Row 4 — 6.48x ThalamicTax Cost Governor, SPL-* Spills & 4-Layer LLM Cache FinOps');
  b.addRowPanels(7, [
    {
      w: 5,
      type: 'gauge',
      title: 'Provider 0.1x Prompt-Cache Hit Ratio',
      unit: 'percentunit',
      min: 0,
      max: 1,
      decimals: 1,
      targets: [{ expr: 'avg(dthalamus_prompt_cache_hit_ratio{job=~"dthalamus.*"})', legend: 'Prompt Cache' }],
      thresholds: [{ color: 'yellow', value: null }, { color: 'green', value: 0.7 }]
    },
    {
      w: 7,
      type: 'piechart',
      title: 'Two-Stage Cortical Response Cache Outcomes',
      targets: [{ expr: 'sum by (result) (dthalamus_cortical_response_cache_requests_total{job=~"dthalamus.*"})', legend: '{{result}}' }]
    },
    {
      w: 6,
      type: 'timeseries',
      title: 'Observation Tokens Saved & SPL-* Spills Created',
      targets: [
        { expr: 'sum(dthalamus_observation_tokens_saved_total{job=~"dthalamus.*"})', legend: 'Tokens Saved' },
        { expr: 'sum(dthalamus_observation_spills_total{job=~"dthalamus.*"})', legend: 'SPL-* Spills' },
        { expr: 'max(nousgent_dthalamus_governed_calls_total)', legend: 'Governed Calls' }
      ]
    },
    {
      w: 6,
      type: 'timeseries',
      title: 'Proxied Session Spend (USD) & 1.25x Cache Thrash Alerts',
      unit: 'currencyUSD',
      decimals: 4,
      targets: [
        { expr: 'sum(dthalamus_session_spend_micro_usd_total{job=~"dthalamus.*"}) / 1000000', legend: 'Session Spend ($)' },
        { expr: 'sum(dthalamus_prompt_cache_thrash_alerts_total{job=~"dthalamus.*"})', legend: 'Cache Thrash Alerts' }
      ]
    }
  ]);

  return wrapDashboard({
    uid: 'dthalamus-ring0-soc-v2',
    title: '02 // dthalamus.to — Ring-0 Reference Monitor, Ingress Shield, DAN-v1.1 RPE & 4-Layer Cache FinOps',
    description: 'Dedicated subcortical Ring-0 telemetry across zero-ingestion web/MCP poisoning shield, Alignment Leases, Phantom Secret Vault, DAN-v1.1 RPE, SEP-2640 skill firewall, and 4-Layer Cache FinOps.',
    tags: ['dthalamus', 'ring0', 'finops', 'dan-rpe', 'chip-0043'],
    panels: b.panels
  });
}

// ============================================================================
// 03 // dbrain.to & cbrain.to — 5-Lobe Chia Merkle Cortex & 4D Connectome SOC
// ============================================================================
function buildDbrainDashboard() {
  const b = createPanelBuilder();

  b.addRow('Row 1 — 5-Lobe Chia DataLayer Cortex, Consensus Sync & Glymphatic Homeostasis');
  b.addRowPanels(4, [
    {
      w: 4,
      type: 'stat',
      title: 'Cortex & Observatory Pods Up',
      targets: [
        { expr: 'sum(up{job=~"dbrain.*"})', legend: 'dbrain-web' },
        { expr: 'sum(up{job=~"cbrain.*"})', legend: 'cbrain-web' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Active Stores & Sovereign Brains',
      targets: [
        { expr: 'max(dbrain_active_stores{job=~"dbrain.*"})', legend: 'Managed Stores' },
        { expr: 'max(nousgent_morphic_field_brains_active)', legend: 'Sovereign Brains' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Live .dig Capsules & Generation',
      targets: [
        { expr: 'max(dbrain_store_capsules{job=~"dbrain.*"})', legend: 'Capsules' },
        { expr: 'max(nousgent_dbrain_primary_generation)', legend: 'Primary Gen #' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Chia L1 Block Cursor & Singletons',
      targets: [
        { expr: 'max(dbrain_l1_sync_cursor_height{job=~"dbrain.*"})', legend: 'L1 Block' },
        { expr: 'max(dbrain_l1_discovered_stores_total{job=~"dbrain.*"})', legend: 'CHIP-0035 Singletons' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'gauge',
      title: 'Glymphatic Collective Health Score',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 1,
      targets: [{ expr: 'max(dbrain_collective_health_score{job=~"dbrain.*"})', legend: 'Health' }],
      thresholds: [{ color: 'red', value: null }, { color: 'yellow', value: 75 }, { color: 'green', value: 90 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Chia PoST Netspace',
      unit: 'bytes',
      targets: [{ expr: 'max(nousgent_chia_netspace_bytes)', legend: 'Netspace' }],
      thresholds: [{ color: 'green', value: null }]
    }
  ]);

  b.addRow('Row 2 — Sub-Millisecond Hybrid Recall, Multi-Tier Cache & cbrain.to 4D wasm32 Connectome');
  b.addRowPanels(7, [
    {
      w: 8,
      type: 'timeseries',
      title: 'Hybrid Semantic + B-Tree/SIMD Recall Latency (p50 / p95 / p99)',
      unit: 's',
      targets: [
        { expr: 'histogram_quantile(0.50, sum by (le) (rate(dbrain_recall_latency_seconds_bucket{job=~"dbrain.*"}[5m])))', legend: 'Recall p50' },
        { expr: 'histogram_quantile(0.95, sum by (le) (rate(dbrain_recall_latency_seconds_bucket{job=~"dbrain.*"}[5m])))', legend: 'Recall p95' },
        { expr: 'histogram_quantile(0.99, sum by (le) (rate(dbrain_recall_latency_seconds_bucket{job=~"dbrain.*"}[5m])))', legend: 'Recall p99' }
      ]
    },
    {
      w: 5,
      type: 'gauge',
      title: 'dbrain Multi-Tier Cache Hit Rate',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 2,
      targets: [
        {
          expr: '100 * sum(dbrain_node_cache_requests_total{job=~"dbrain.*",result="hit"}) / clamp_min(sum(dbrain_node_cache_requests_total{job=~"dbrain.*"}), 1)',
          legend: 'dbrain Hit %'
        }
      ],
      thresholds: [{ color: 'yellow', value: null }, { color: 'green', value: 85 }]
    },
    {
      w: 5,
      type: 'gauge',
      title: 'cbrain.to 3-Tier Projection Hit Rate',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 2,
      targets: [
        {
          expr: '100 * sum(cbrain_cache_hits_total{job=~"cbrain.*"}) / clamp_min(sum(cbrain_cache_hits_total{job=~"cbrain.*"}) + sum(cbrain_cache_misses_total{job=~"cbrain.*"}), 1)',
          legend: 'cbrain Hit %'
        }
      ],
      thresholds: [{ color: 'yellow', value: null }, { color: 'green', value: 90 }]
    },
    {
      w: 6,
      type: 'stat',
      title: 'cbrain.to wasm32 Kernel & Drift Coherence',
      targets: [
        { expr: 'max(cbrain_wasm_spatial_bytes{job=~"cbrain.*"})', legend: 'wasm32 Bytes' },
        { expr: 'max(nousgent_cbrain_coherence_pct)', legend: 'Coherence %' }
      ],
      colorMode: 'palette-classic'
    }
  ]);

  b.addRow('Row 3 — Post-Quantum WOTS+-SHA256 + Ed25519, DID Custody & GDPR Art. 17 Crypto-Shredding');
  b.addRowPanels(6, [
    {
      w: 4,
      type: 'stat',
      statBg: true,
      sparkline: false,
      title: 'GDPR DEK / Tombstone Anomalies (Target = 0)',
      targets: [{ expr: 'max(dbrain_dek_unshredded_tombstone_anomalies{job=~"dbrain.*"} + dbrain_tombstone_unredacted_anomalies{job=~"dbrain.*"})', legend: 'Anomalies' }],
      thresholds: [{ color: 'green', value: null }, { color: 'red', value: 1 }]
    },
    {
      w: 4,
      type: 'stat',
      statBg: true,
      sparkline: false,
      title: 'SQLite PRAGMA secure_delete',
      mappings: PASS_FAIL_MAPPINGS,
      targets: [{ expr: 'min(dbrain_sqlite_secure_delete_enabled{job=~"dbrain.*"})', legend: 'secure_delete' }],
      thresholds: [{ color: 'red', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 5,
      type: 'stat',
      title: 'Wrapped AES-GCM DEKs, KEK Epoch & Tombstones',
      targets: [
        { expr: 'max(dbrain_active_wrapped_deks{job=~"dbrain.*"})', legend: 'Wrapped DEKs' },
        { expr: 'max(dbrain_kek_rotation_epoch{job=~"dbrain.*"})', legend: 'KEK Epoch' },
        { expr: 'max(dbrain_gdpr_tombstones_total{job=~"dbrain.*"})', legend: 'GDPR Tombstones' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 6,
      type: 'timeseries',
      title: 'WOTS+ OTS Reuse & Hybrid PQC Verify Failures by Gate',
      targets: [
        { expr: 'sum(dbrain_wots_ots_key_reuse_violations_total{job=~"dbrain.*"})', legend: 'WOTS+ OTS Reuse' },
        { expr: 'sum by (gate) (dbrain_capsule_pqc_verify_failures_total{job=~"dbrain.*"})', legend: 'PQC Fail · {{gate}}' }
      ]
    },
    {
      w: 5,
      type: 'bargauge',
      title: 'Pinned DIDs & Custody Downgrade Blocks',
      targets: [
        { expr: 'max by (state) (dbrain_registered_dids{job=~"dbrain.*"})', legend: 'DID · {{state}}' },
        { expr: 'sum(dbrain_custody_downgrade_blocks_total{job=~"dbrain.*"})', legend: 'Downgrade Blocks' }
      ],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    }
  ]);

  b.addRow('Row 4 — Gate-0 Write Hygiene, P2P Morphic Gossip, UTXO Sequencer & Continual Learning');
  b.addRowPanels(7, [
    {
      w: 6,
      type: 'bargauge',
      title: 'Gate-0 & HTTP Write Rejections by Reason',
      targets: [
        { expr: 'sum by (reason) (dbrain_gate0_write_rejections_total{job=~"dbrain.*"})', legend: 'Gate-0 · {{reason}}' },
        { expr: 'sum by (reason) (dbrain_http_write_blocks_total{job=~"dbrain.*"})', legend: 'HTTP · {{reason}}' }
      ],
      thresholds: [{ color: 'green', value: null }, { color: 'orange', value: 1 }, { color: 'red', value: 10 }]
    },
    {
      w: 6,
      type: 'timeseries',
      title: 'Morphic P2P Gossip Envelopes, Rejections & Peer Divergence',
      targets: [
        { expr: 'sum by (outcome) (increase(dbrain_gossip_envelopes_total{job=~"dbrain.*"}[10m]))', legend: '{{outcome}}' },
        { expr: 'sum by (reason) (increase(dbrain_gossip_rejections_total{job=~"dbrain.*"}[10m]))', legend: 'Reject · {{reason}}' },
        { expr: 'max(dbrain_peer_merkle_divergence_stores{job=~"dbrain.*"})', legend: 'Divergent Stores' }
      ]
    },
    {
      w: 5,
      type: 'timeseries',
      title: 'Chia Singleton UTXO Sequencer Queue & Oldest Pending Age (s)',
      targets: [
        { expr: 'max(dbrain_utxo_sequencer_pending_ops{job=~"dbrain.*"})', legend: 'Pending Ops' },
        { expr: 'max(dbrain_utxo_sequencer_oldest_pending_seconds{job=~"dbrain.*"})', legend: 'Oldest Age (s)' }
      ]
    },
    {
      w: 7,
      type: 'bargauge',
      title: '2,048-KC Synapses, 89B ESS1 Sleep ES, Surrogate Replay & SEP-2640 Reads',
      targets: [
        { expr: 'max(dbrain_kc_active_synapses{job=~"dbrain.*"})', legend: '2,048-KC Active Synapses' },
        { expr: 'max(dbrain_plasticity_labile_capsules{job=~"dbrain.*"})', legend: 'Labile Capsules' },
        { expr: 'max(dbrain_es_active_policies{job=~"dbrain.*"})', legend: '12D ES Policies' },
        { expr: 'sum(dbrain_es_seed_pulses_applied_total{job=~"dbrain.*"})', legend: '89B ESS1 Applied' },
        { expr: 'sum(dbrain_surrogate_episodes_synthesized_total{job=~"dbrain.*"})', legend: 'Surrogate Episodes' },
        { expr: 'sum(dbrain_mcp_skill_reads_total{job=~"dbrain.*"})', legend: 'SEP-2640 Skill Reads' }
      ],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    }
  ]);

  return wrapDashboard({
    uid: 'dbrain-cortex-soc-v2',
    title: '03 // dbrain.to & cbrain.to — 5-Lobe Chia Merkle Cortex, PQC/GDPR Security, Sleep ES & 4D Connectome',
    description: 'Dedicated cortical memory, Chia DataLayer CHIP-0035 consensus, WOTS+ post-quantum & GDPR DEK shredding, Morphic gossip, continual learning, and cbrain.to 4D connectome telemetry.',
    tags: ['dbrain', 'cbrain', 'chia', 'pqc', 'gdpr', 'ess1'],
    panels: b.panels
  });
}

// ============================================================================
// 04 // liquidi.sh & shi.liquidi.sh — Liquid Intelligence DEX & $DIG Royalties
// ============================================================================
function buildLiquidishDashboard() {
  const b = createPanelBuilder();

  b.addRow('Row 1 — Liquid Intelligence DEX Health, $DIG CAT2 Royalties & Orderbook Inventory');
  b.addRowPanels(4, [
    {
      w: 4,
      type: 'stat',
      title: 'liquidi.sh Replicas & SQLite Delete',
      targets: [
        { expr: 'sum(up{job=~"liquidish.*"})', legend: 'Pods Up' },
        { expr: 'min(liquidish_sqlite_secure_delete_enabled{job=~"liquidish.*"})', legend: 'secure_delete' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'gauge',
      title: 'Orderbook Glymphatic Health Score',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 1,
      targets: [{ expr: 'max(liquidish_collective_health_score{job=~"liquidish.*"})', legend: 'Health' }],
      thresholds: [{ color: 'red', value: null }, { color: 'yellow', value: 80 }, { color: 'green', value: 95 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'WAL Assets & Orderbook Listings',
      targets: [
        { expr: 'max(liquidish_capsules_total{job=~"liquidish.*"})', legend: 'WAL Assets' },
        { expr: 'max(nousgent_liquidish_orderbook_available)', legend: 'Listed' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Citation-DAG Royalties Streamed ($DIG)',
      decimals: 3,
      targets: [{ expr: 'max(nousgent_liquidish_royalties_dig)', legend: '$DIG Streamed' }],
      thresholds: [{ color: 'green', value: null }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Settled Swaps & Antibody Bonds',
      targets: [
        { expr: 'max(liquidish_settled_swaps_total{job=~"liquidish.*"})', legend: 'CHIP-0035 Swaps' },
        { expr: 'max(liquidish_antibody_bonds_total{job=~"liquidish.*"})', legend: 'Antibody Bonds' },
        { expr: 'max(nousgent_liquidish_antibody_tvl_dig)', legend: 'Staked TVL ($DIG)' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Autonomous +Δ% Candidate Queue',
      targets: [
        { expr: 'max(nousgent_liquidish_candidate_queue_total)', legend: '+Δ% Queue' },
        { expr: 'max(liquidish_thalamic_asset_classes_total{job=~"liquidish.*"}) + max(liquidish_olfactory_asset_classes_total{job=~"liquidish.*"})', legend: 'Subcortical Classes' }
      ],
      colorMode: 'palette-classic'
    }
  ]);

  b.addRow('Row 2 — Dual-Host Plane Isolation: shi.liquidi.sh (M2M) vs liquidi.sh (Human DEX)');
  b.addRowPanels(7, [
    {
      w: 10,
      type: 'timeseries',
      title: 'shi.liquidi.sh (Autonomous M2M) vs liquidi.sh (Human DEX) Cumulative Traffic',
      targets: [
        { expr: 'max(nousgent_liquidish_shi_requests{plane="m2m_shi"})', legend: 'shi.liquidi.sh (m2m_shi)' },
        { expr: 'max(nousgent_liquidish_shi_requests{plane="human_ui"})', legend: 'liquidi.sh (human_ui)' }
      ]
    },
    {
      w: 5,
      type: 'piechart',
      title: 'M2M vs Human DEX Traffic Split',
      targets: [{ expr: 'max by (plane) (nousgent_liquidish_shi_requests)', legend: '{{plane}}' }]
    },
    {
      w: 4,
      type: 'gauge',
      title: 'shi.liquidi.sh M2M Share %',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 1,
      targets: [{ expr: 'max(nousgent_liquidish_shi_m2m_share_pct)', legend: 'M2M %' }],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 40 }]
    },
    {
      w: 5,
      type: 'timeseries',
      title: 'Exchange Probe Latency (ms)',
      unit: 'ms',
      decimals: 1,
      targets: [{ expr: 'avg(nousgent_organ_latency_ms{organ="shi.liquidi.sh"})', legend: 'shi.liquidi.sh' }]
    }
  ]);

  b.addRow('Row 3 — Exchange Ring-0 Ingress Shield, 3-Tier LRU Cache, Dream Consolidation & Surrogate ES');
  b.addRowPanels(7, [
    {
      w: 8,
      type: 'timeseries',
      title: 'Exchange 3-Tier @cbrain/core Cache Hits vs Misses (RPS)',
      unit: 'ops',
      targets: [
        { expr: 'sum(rate(cbrain_cache_hits_total{job=~"liquidish.*"}[5m]))', legend: 'Cache Hits/s' },
        { expr: 'sum(rate(cbrain_cache_misses_total{job=~"liquidish.*"}[5m]))', legend: 'Cache Misses/s' }
      ]
    },
    {
      w: 8,
      type: 'bargauge',
      title: 'Exchange 7-Detector Shield, Quarantine & Dream Antibodies',
      targets: [
        { expr: 'max(cbrain_dthalamus_ingress_inspected_total{job=~"liquidish.*"})', legend: 'Ingress Inspected' },
        { expr: 'max(cbrain_dthalamus_ingress_blocked_total{job=~"liquidish.*"})', legend: 'Poison Blocked' },
        { expr: 'max(cbrain_dthalamus_ingress_quarantined_active{job=~"liquidish.*"})', legend: 'Active QRN-*' },
        { expr: 'max(nousgent_liquidish_dream_survivors)', legend: 'Dream Survivors' },
        { expr: 'max(nousgent_liquidish_dream_antibodies)', legend: 'Dream Antibodies' }
      ],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 8,
      type: 'timeseries',
      title: 'Zero-I/O Surrogate Episodes, Subtree ES Transfers & SEP-2640 Reads',
      targets: [
        { expr: 'max(dbrain_surrogate_episodes_synthesized_total{job=~"liquidish.*"})', legend: 'Surrogate Episodes' },
        { expr: 'max(dbrain_es_subtree_transfers_total{job=~"liquidish.*"})', legend: 'Subtree ES Transfers' },
        { expr: 'max(liquidish_mcp_skill_reads_total{job=~"liquidish.*"})', legend: 'SEP-2640 Skill Reads' },
        { expr: 'max(cbrain_dthalamus_tokens_saved_total{job=~"liquidish.*"})', legend: 'Spill Tokens Saved' }
      ]
    }
  ]);

  return wrapDashboard({
    uid: 'liquidish-dex-soc-v2',
    title: '04 // liquidi.sh & shi.liquidi.sh — Liquid Intelligence DEX, $DIG Royalties, Antibody Staking & Dual-Plane Traffic',
    description: 'Dedicated marketplace & tokenomics telemetry across $DIG CAT2 (10^3 mojos) Citation-DAG royalties, CHIP-0035 swaps, antibody staking, shi.liquidi.sh M2M plane, and dream consolidation.',
    tags: ['liquidish', 'shi.liquidi.sh', 'dig-cat2', 'royalties', 'chip-0035'],
    panels: b.panels
  });
}

// ============================================================================
// 05 // nousgent.ai & ia.nousgent.ai — Flagship Bounded DRSI Mission Control
// ============================================================================
function buildNousgentDashboard() {
  const b = createPanelBuilder();

  b.addRow('Row 1 — Bounded ASI Readiness Index (BARI) & 5-Organ Orthogonal Bus Health');
  b.addRowPanels(5, [
    {
      w: 4,
      type: 'gauge',
      title: 'Bounded ASI Readiness Index (BARI %)',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 1,
      targets: [{ expr: 'max(nousgent_bari_score_pct)', legend: 'BARI %' }],
      thresholds: [{ color: 'red', value: null }, { color: 'yellow', value: 75 }, { color: 'green', value: 88 }]
    },
    {
      w: 7,
      type: 'bargauge',
      title: '5-Axis BARI Readiness Breakdown',
      unit: 'percent',
      min: 0,
      max: 100,
      decimals: 1,
      targets: [{ expr: 'max by (axis) (nousgent_bari_axis_pct)', legend: '{{axis}}' }],
      thresholds: [{ color: 'yellow', value: null }, { color: 'green', value: 80 }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Forgetting (0.0%) & Consensus %',
      targets: [
        { expr: 'max(nousgent_catastrophic_forgetting_pct)', legend: 'Forgetting %' },
        { expr: 'max(nousgent_swarm_consensus_pct)', legend: 'Swarm Consensus %' },
        { expr: 'max(nousgent_upstream_organs_reachable)', legend: 'Organs Live / 5' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 9,
      type: 'state-timeline',
      title: '5-Organ Live Bus & Stack Scrape Health Timeline',
      mappings: UP_DOWN_MAPPINGS,
      targets: [
        { expr: 'max by (organ) (nousgent_organ_up)', legend: '{{organ}}' },
        { expr: 'min by (job) (up{job=~"nousgent-web|dolfactory-pods-headless|dthalamus-pods-headless|dbrain-cluster-headless|cbrain-web|liquidish-pods-headless"})', legend: 'scrape:{{job}}' }
      ],
      thresholds: [{ color: 'red', value: null }, { color: 'green', value: 1 }]
    }
  ]);

  b.addRow('Row 2 — Dual-Host Plane Isolation (nousgent.ai Human UI vs ia.nousgent.ai M2M) & Organ Latencies');
  b.addRowPanels(7, [
    {
      w: 9,
      type: 'timeseries',
      title: 'nousgent.ai (Human UI) vs ia.nousgent.ai (M2M Swarm) Request Rate (RPS)',
      unit: 'reqps',
      targets: [
        { expr: 'sum(rate(nousgent_http_requests_total{plane="human_ui"}[1m]))', legend: 'nousgent.ai (human_ui)' },
        { expr: 'sum(rate(nousgent_http_requests_total{plane="m2m_ia"}[1m]))', legend: 'ia.nousgent.ai (m2m_ia)' }
      ]
    },
    {
      w: 5,
      type: 'piechart',
      title: 'Cumulative Dual-Plane Share',
      targets: [{ expr: 'sum by (host, plane) (nousgent_http_requests_total)', legend: '{{host}} ({{plane}})' }]
    },
    {
      w: 10,
      type: 'timeseries',
      title: '5-Organ Inter-Service Probe Latency (ms)',
      unit: 'ms',
      decimals: 2,
      targets: [{ expr: 'avg by (organ) (nousgent_organ_latency_ms)', legend: '{{organ}}' }]
    }
  ]);

  b.addRow('Row 3 — 50-State Civic Morphic Mesh, Cortex Sync & Green American PoST Dividend');
  b.addRowPanels(4, [
    {
      w: 4,
      type: 'stat',
      title: 'Enlisted Nodes & Active States',
      targets: [
        { expr: 'max(nousgent_enlisted_nodes_total)', legend: 'Enlisted Rigs' },
        { expr: 'max(nousgent_active_states_count)', legend: 'US States Active' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Bonded Civic PoST Storage (PB)',
      decimals: 2,
      targets: [{ expr: 'max(nousgent_enlisted_storage_pb)', legend: 'PB Bonded' }],
      thresholds: [{ color: 'green', value: null }]
    },
    {
      w: 4,
      type: 'stat',
      title: 'Morphic Brains & Live .dig Capsules',
      targets: [
        { expr: 'max(nousgent_morphic_field_brains_active)', legend: 'Morphic Brains' },
        { expr: 'max(nousgent_dbrain_live_capsules_total)', legend: 'Live Capsules' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Cortex Gen # vs FROZEN_SERVE',
      targets: [
        { expr: 'max(nousgent_dbrain_primary_generation)', legend: 'Live Gen #' },
        { expr: 'max(nousgent_frozen_serve_generation)', legend: 'FROZEN_SERVE #' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Green Dividend (MW & Gal H2O/wk)',
      targets: [
        { expr: 'max(nousgent_megawatts_saved)', legend: 'MW Saved' },
        { expr: 'max(nousgent_water_gallons_saved)', legend: 'Gal H2O Saved' }
      ],
      colorMode: 'palette-classic'
    },
    {
      w: 4,
      type: 'stat',
      title: 'Live Evolutions Streams & Halo NPU',
      targets: [
        { expr: 'sum(nousgent_active_evolutions_streams)', legend: 'NDJSON Streams' },
        { expr: 'max(nousgent_halo_configured)', legend: 'Halo Configured' }
      ],
      colorMode: 'palette-classic'
    }
  ]);

  b.addRow('Row 4 — Pod Bay Red-Team Defense, SEP-2640 Skill Firewall, Bounded DRSI & Two-Key DAO Governance');
  b.addRowPanels(7, [
    {
      w: 8,
      type: 'timeseries',
      title: 'Pod Bay Deflections, Sub-Harness Denials, SEP-2640 Blocks & HTTP 429 Rate Limits',
      targets: [
        { expr: 'sum(nousgent_redteam_deflections_total)', legend: 'Pod Bay Deflections' },
        { expr: 'sum(nousgent_subharness_denials_total)', legend: 'Sub-Harness Denials' },
        { expr: 'sum(nousgent_mcp_skill_reads_total{outcome="verified"})', legend: 'SEP-2640 Verified Reads' },
        { expr: 'sum(nousgent_mcp_skill_reads_total{outcome="blocked"})', legend: 'SEP-2640 Trojan Blocked' },
        { expr: 'sum(nousgent_rate_limited_blocks_total)', legend: 'HTTP 429 Rate-Limited' }
      ]
    },
    {
      w: 8,
      type: 'bargauge',
      title: 'DAO Governance Pipeline & Two-Key CHIP-0043 Quorum',
      targets: [
        { expr: 'max by (status) (nousgent_missions_total)', legend: '{{status}}' },
        { expr: 'sum(nousgent_dao_votes_total)', legend: 'Mode-2 DAO Votes' },
        { expr: 'sum(nousgent_clear_sign_signatures_total)', legend: 'Two-Key Signatures' }
      ],
      thresholds: [{ color: 'blue', value: null }, { color: 'green', value: 1 }]
    },
    {
      w: 8,
      type: 'bargauge',
      title: 'Bounded DRSI Flywheel (Quests, Soft-HURT Vetoes, ESS1 Seeds & Antibodies)',
      targets: [
        { expr: 'max(nousgent_blind_spot_quests_total)', legend: 'Open Blind-Spot Quests' },
        { expr: 'max(nousgent_rejected_edits_total)', legend: 'Soft-HURT Blocked Edits' },
        { expr: 'sum(nousgent_es_seed_pulses_total)', legend: '89B ESS1 Seed Pulses' },
        { expr: 'sum(nousgent_surrogate_episodes_total)', legend: 'Surrogate Replay Episodes' },
        { expr: 'max(nousgent_verified_antibodies_total)', legend: 'Cross-Organ Antibodies' }
      ],
      thresholds: [{ color: 'purple', value: null }, { color: 'green', value: 1 }]
    }
  ]);

  return wrapDashboard({
    uid: 'nousgent-cleanroom-soc-v1',
    title: '05 // nousgent.ai & ia.nousgent.ai — Flagship Bounded DRSI Mission Control, 5-Organ Bus & M2M Swarm SOC',
    description: 'Flagship Bounded DRSI Mission Control & M2M Swarm telemetry uniting BARI 5-axis readiness, 5-organ bus latencies, dual-host RPS, Pod Bay red-team defense, SEP-2640 skill firewall, and Two-Key CHIP-0043 governance.',
    tags: ['nousgent', 'ia.nousgent.ai', 'bounded-drsi', 'bari', 'chip-0043'],
    panels: b.panels
  });
}

const DASHBOARD_OUTPUTS = [
  ['grafana-01-dolfactory-soc-dashboard.json', buildDolfactoryDashboard()],
  ['grafana-02-dthalamus-soc-dashboard.json', buildDthalamusDashboard()],
  ['grafana-03-dbrain-soc-dashboard.json', buildDbrainDashboard()],
  ['grafana-04-liquidish-soc-dashboard.json', buildLiquidishDashboard()],
  ['grafana-nousgent-soc-dashboard.json', buildNousgentDashboard()]
];

for (const dir of OBS_DIRS) {
  if (!fs.existsSync(path.dirname(dir))) continue;
  fs.mkdirSync(dir, { recursive: true });
  for (const [filename, jsonObj] of DASHBOARD_OUTPUTS) {
    const outPath = path.join(dir, filename);
    fs.writeFileSync(outPath, JSON.stringify(jsonObj, null, 2) + '\n', 'utf8');
  }
}

let totalPanels = 0;
let totalBytes = 0;
for (const [filename, obj] of DASHBOARD_OUTPUTS) {
  const nonRowCount = obj.panels.filter((p) => p.type !== 'row').length;
  const bytes = Buffer.byteLength(JSON.stringify(obj, null, 2));
  totalPanels += nonRowCount;
  totalBytes += bytes;
  console.log(`  ✓ ${filename.padEnd(44)} uid=${obj.uid.padEnd(28)} panels=${nonRowCount} (${(bytes / 1024).toFixed(1)} KB)`);
}
console.log(`\nGenerated 5 split-out Grafana 11 dashboards (${totalPanels} visualization panels, ${(totalBytes / 1024).toFixed(1)} KB total).`);
