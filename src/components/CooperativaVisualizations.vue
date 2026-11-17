<script setup>
import { computed } from 'vue'
import { BarChart3, Info, Lock, TrendingUp } from 'lucide-vue-next'
import { KPI_HISTORICAL_SERIES } from '../data/cooperativaModels.js'

const props = defineProps({
  period: {
    type: Object,
    required: true,
  },
  selectedAudience: {
    type: String,
    default: 'todos',
  },
  categoryFilter: {
    type: String,
    default: 'todas',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const isPublicMode = computed(() => props.selectedAudience === 'comunidad')

// Datos para Visualización 1: Barras de KPIs actuales vs Meta
const kpiMetaSpecs = [
  { id: 'TEUP', label: 'TEUP (Uso PC)', category: 'Financiero / Recursos', targetVal: 75, targetLabel: '75–85%', totalContext: 'N = 80 hs lab' },
  { id: 'IASS', label: 'IASS (Satisfacción)', category: 'Usuarios / Comunidad', targetVal: 85, targetLabel: '≥ 85%', totalContext: 'N = 20 pts máx' },
  { id: 'PDFT', label: 'PDFT (Defectos QA)', category: 'Procesos Internos', targetVal: 10, targetLabel: '≤ 10%', totalContext: 'N = 60 pruebas' },
  { id: 'IPEC', label: 'IPEC (Participación)', category: 'Personas / Aprendizaje', targetVal: 85, targetLabel: '≥ 85%', totalContext: 'N = 20 socios' },
]

const barChartItems = computed(() => {
  return kpiMetaSpecs
    .filter((spec) => {
      if (isPublicMode.value && spec.id !== 'IASS') return false
      if (props.categoryFilter !== 'todas' && spec.category !== props.categoryFilter) return false
      return true
    })
    .map((spec) => {
      const entry = props.period?.values?.[spec.id] || { value: null, formatted: 'N/A', statusType: 'neutral' }
      return {
        ...spec,
        value: entry.value,
        formatted: entry.formatted,
        statusType: entry.statusType,
        math: entry.math || '',
      }
    })
})

const hasAnyNumericBar = computed(() => barChartItems.value.some((item) => item.value !== null && item.value !== undefined))

function barColor(statusType) {
  if (statusType === 'danger') return '#dc2626'
  if (statusType === 'warning') return '#d97706'
  if (statusType === 'neutral') return '#94a3b8'
  return '#0d9488'
}

// Datos para Visualización 2: Gráfico de Líneas (Evolución Ago - Oct 2026)
// Escala Y honesta de 0% a 100%, SVG viewBox 560 x 230
const chartW = 560
const chartH = 220
const padL = 46
const padR = 24
const padT = 20
const padB = 34
const plotW = chartW - padL - padR
const plotH = chartH - padT - padB

function xPos(idx, total) {
  if (total <= 1) return padL + plotW / 2
  return padL + (idx / (total - 1)) * plotW
}

function yPos(val) {
  const clamped = Math.max(0, Math.min(100, val))
  return padT + plotH - (clamped / 100) * plotH
}

const trendSeries = computed(() => {
  const allSeries = [
    { key: 'TEUP', name: 'TEUP (Uso PC)', color: '#0d9488', dash: '' },
    { key: 'IPEC', name: 'IPEC (Participación)', color: '#0284c7', dash: '' },
    { key: 'PDFT', name: 'PDFT (Defectos QA — Meta ≤10%)', color: '#dc2626', dash: '5 4' },
    { key: 'IASS', name: 'IASS (Satisfacción)', color: '#7c3aed', dash: '' },
  ]
  const visible = isPublicMode.value ? allSeries.filter((s) => s.key === 'IASS') : allSeries
  return visible.map((s) => {
    const pts = KPI_HISTORICAL_SERIES.map((row, idx) => {
      const v = row[s.key]
      return v === null || v === undefined
        ? null
        : { x: xPos(idx, KPI_HISTORICAL_SERIES.length), y: yPos(v), val: v, period: row.period }
    }).filter(Boolean)
    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    return { ...s, pts, pathD }
  })
})

// Datos para Visualización 3: QA por Proyecto y Participación por Comisión
const qaItems = computed(() => {
  const list = props.period?.qaByProject || []
  return list.map((item) => {
    const rate = item.cases > 0 ? ((item.bugs / item.cases) * 100).toFixed(1) : null
    return {
      ...item,
      rate,
      isAlert: rate !== null && Number(rate) > 10,
    }
  })
})

const commissionItems = computed(() => {
  const list = props.period?.commissionParticipation || []
  return list.map((c) => {
    const pct = c.totalTasks > 0 ? Math.round((c.completedTasks / c.totalTasks) * 100) : 0
    return { ...c, pct }
  })
})
</script>

<template>
  <section class="viz-section" aria-label="Visualizaciones analíticas de la cooperativa">
    <div class="viz-section-head">
      <div>
        <span class="kpi-subtitle-eyebrow">VISUALIZACIONES DE DATOS (GESTALT Y ESTADÍSTICA DESCRIPTIVA)</span>
        <h3>Gráficos de Seguimiento, Tendencia Histórica y Foco Operativo</h3>
        <p>
          Período seleccionado: <strong>{{ period.label }}</strong> · Escalas desde 0% con totales
          explícitos y codificación redundante (color + etiqueta textual).
        </p>
      </div>
    </div>

    <div :class="['viz-grid', compact ? 'viz-grid-compact' : '']">
      <!-- VISUALIZACIÓN 1: BARRAS COMPARATIVAS VS META -->
      <article class="viz-card">
        <div class="viz-card-head">
          <div>
            <span class="viz-tag">Visualización 1 · Barras comparativas</span>
            <h4>Resultado vs. Meta Pautada por Indicador (%)</h4>
            <p class="viz-meta-line">
              Período: {{ period.shortLabel }} · Unidad: Porcentaje (%) · Criterio: Barra gris = Meta
            </p>
          </div>
          <BarChart3 :size="18" class="viz-icon" />
        </div>

        <div v-if="period.isEmptyTest || !hasAnyNumericBar" class="viz-empty-box">
          <Info :size="20" />
          <div>
            <strong>Sin valores calculables para graficar en {{ period.label }}</strong>
            <p>
              Ante denominadores en cero (0 horas disponibles, 0 entregas o 0 pruebas), el sistema
              omite las barras para evitar representar erróneamente un 0% operativo.
            </p>
          </div>
        </div>

        <div v-else class="viz-bars-list">
          <div v-for="item in barChartItems" :key="item.id" class="viz-bar-row">
            <div class="viz-bar-labels">
              <div>
                <strong>{{ item.label }}</strong>
                <span class="viz-total-chip">{{ item.totalContext }}</span>
              </div>
              <div class="viz-bar-numbers">
                <span :class="['viz-val-badge', item.statusType]">{{ item.formatted }}</span>
                <span class="viz-target-hint">Meta: {{ item.targetLabel }}</span>
              </div>
            </div>

            <div v-if="item.value === null" class="viz-bar-na">
              {{ item.math || 'N/A en este período' }}
            </div>
            <div v-else class="viz-bar-track" :aria-label="`${item.label}: ${item.formatted}`">
              <!-- Marca vertical de meta -->
              <div
                class="viz-target-marker"
                :style="{ left: `${item.targetVal}%` }"
                :title="`Meta: ${item.targetLabel}`"
              />
              <div
                class="viz-bar-fill"
                :style="{
                  width: `${Math.min(100, Math.max(2, item.value))}%`,
                  backgroundColor: barColor(item.statusType),
                }"
              />
            </div>
          </div>
        </div>

        <p class="viz-gestalt-note">
          <strong>Principios Gestalt:</strong> <em>Figura-fondo</em> (barras sólidas sobre pista neutra) y
          <em>Similitud</em> (verde = en meta, rojo = desvío PDFT > 10%).
        </p>
      </article>

      <!-- VISUALIZACIÓN 2: EVOLUCIÓN HISTÓRICA (LÍNEAS) -->
      <article class="viz-card">
        <div class="viz-card-head">
          <div>
            <span class="viz-tag">Visualización 2 · Serie temporal</span>
            <h4>Evolución Trimestral de KPIs (Ago – Oct 2026)</h4>
            <p class="viz-meta-line">
              Escala Y: 0% a 100% (eje completo sin recortes) · Puntos: cortes mensuales
            </p>
          </div>
          <TrendingUp :size="18" class="viz-icon" />
        </div>

        <div class="viz-legend">
          <span v-for="s in trendSeries" :key="s.key" class="viz-legend-item">
            <span class="viz-legend-swatch" :style="{ backgroundColor: s.color }" />
            {{ s.name }}
          </span>
        </div>

        <div class="viz-svg-wrap">
          <svg
            :viewBox="`0 0 ${chartW} ${chartH}`"
            class="viz-svg"
            role="img"
            aria-label="Gráfico de líneas de evolución histórica de indicadores entre agosto y octubre de 2026"
          >
            <!-- Grilla horizontal cada 25% -->
            <g v-for="tick in [0, 25, 50, 75, 100]" :key="tick">
              <line
                :x1="padL"
                :y1="yPos(tick)"
                :x2="chartW - padR"
                :y2="yPos(tick)"
                stroke="#e2e8f0"
                stroke-width="1"
              />
              <text
                :x="padL - 8"
                :y="yPos(tick) + 4"
                text-anchor="end"
                font-size="11"
                fill="#64748b"
              >
                {{ tick }}%
              </text>
            </g>

            <!-- Línea umbral PDFT 10% -->
            <line
              v-if="!isPublicMode"
              :x1="padL"
              :y1="yPos(10)"
              :x2="chartW - padR"
              :y2="yPos(10)"
              stroke="#fca5a5"
              stroke-width="1"
              stroke-dasharray="3 3"
            />

            <!-- Etiquetas eje X -->
            <text
              v-for="(row, idx) in KPI_HISTORICAL_SERIES"
              :key="row.period"
              :x="xPos(idx, KPI_HISTORICAL_SERIES.length)"
              :y="chartH - 10"
              text-anchor="middle"
              font-size="11"
              font-weight="600"
              fill="#475569"
            >
              {{ row.period }}
            </text>

            <!-- Series -->
            <g v-for="s in trendSeries" :key="s.key">
              <path
                v-if="s.pts.length > 1"
                :d="s.pathD"
                fill="none"
                :stroke="s.color"
                stroke-width="2.6"
                :stroke-dasharray="s.dash || undefined"
                stroke-linecap="round"
              />
              <g v-for="(pt, pIdx) in s.pts" :key="`${s.key}-${pIdx}`">
                <circle :cx="pt.x" :cy="pt.y" r="4.5" :fill="s.color" stroke="#ffffff" stroke-width="1.5" />
                <text
                  :x="pt.x"
                  :y="s.key === 'IPEC' ? pt.y - 10 : pt.y + 14"
                  text-anchor="middle"
                  font-size="10.5"
                  font-weight="700"
                  :fill="s.color"
                >
                  {{ pt.val }}%
                </text>
              </g>
            </g>
          </svg>
        </div>

        <p class="viz-gestalt-note">
          <strong>Principios Gestalt:</strong> <em>Continuidad</em> (trazos conectados por mes que muestran
          la caída progresiva de PDFT 18.2% → 13.3%) y <em>Proximidad</em> (valores junto a cada nodo).
        </p>
      </article>

      <!-- VISUALIZACIÓN 3: DETALLE QA Y PARTICIPACIÓN POR COMISIÓN -->
      <article class="viz-card viz-card-wide">
        <div class="viz-card-head">
          <div>
            <span class="viz-tag">Visualización 3 · Desglose operativo (Causas de PDFT e IPEC)</span>
            <h4>Defectos QA por Proyecto y Cumplimiento por Comisión</h4>
            <p class="viz-meta-line">
              Período: {{ period.shortLabel }} · Totales absolutos junto a cada porcentaje para evitar sesgos de tamaño muestral
            </p>
          </div>
        </div>

        <div v-if="isPublicMode" class="viz-restricted-box">
          <Lock :size="18" />
          <div>
            <strong>Desglose interno reservado en Vista Pública</strong>
            <p>
              Para preservar el anonimato de estudiantes y comisiones, el detalle de defectos QA por
              proyecto y tareas por comisión solo se muestra al Consejo, Referentes y Docentes Asesores.
            </p>
          </div>
        </div>

        <div v-else-if="period.isEmptyTest || (qaItems.length === 0 && commissionItems.length === 0)" class="viz-empty-box">
          <Info :size="20" />
          <div>
            <strong>Sin registros de pruebas QA ni tareas en {{ period.label }}</strong>
            <p>No se ejecutaron casos de prueba ni sesiones de comisión en el corte seleccionado.</p>
          </div>
        </div>

        <div v-else class="viz-split-cols">
          <!-- Sub-panel A: QA por proyecto -->
          <div class="viz-subpanel">
            <h5>Defectos QA por Proyecto (Base de PDFT)</h5>
            <div v-for="proj in qaItems" :key="proj.id" class="viz-mini-row">
              <div class="viz-mini-top">
                <span><strong>{{ proj.id }}</strong> · {{ proj.name }}</span>
                <span :class="['viz-mini-stat', proj.isAlert ? 'danger' : 'ok']">
                  {{ proj.bugs }}/{{ proj.cases }} casos ({{ proj.rate }}%)
                </span>
              </div>
              <div class="viz-mini-track">
                <div
                  class="viz-mini-fill"
                  :style="{
                    width: `${Math.min(100, Math.max(4, Number(proj.rate) * 3))}%`,
                    backgroundColor: proj.isAlert ? '#dc2626' : '#0d9488',
                  }"
                />
              </div>
            </div>
          </div>

          <!-- Sub-panel B: Participación por comisión -->
          <div class="viz-subpanel">
            <h5>Cumplimiento de Tareas por Comisión (Base de IPEC)</h5>
            <div v-for="com in commissionItems" :key="com.name" class="viz-mini-row">
              <div class="viz-mini-top">
                <span><strong>{{ com.name }}</strong> ({{ com.active }}/{{ com.members }} socios activos)</span>
                <span class="viz-mini-stat ok">
                  {{ com.completedTasks }}/{{ com.totalTasks }} tareas ({{ com.pct }}%)
                </span>
              </div>
              <div class="viz-mini-track">
                <div
                  class="viz-mini-fill"
                  :style="{
                    width: `${com.pct}%`,
                    backgroundColor: com.pct >= 85 ? '#0d9488' : '#d97706',
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <p class="viz-gestalt-note">
          <strong>Lectura analítica:</strong> Permite identificar que <code>PR-002</code> concentra
          la mayor carga de pruebas y defectos (5 de 8 bugs en Oct 2026), mientras que todas las
          comisiones sostienen ≥ 80% de cumplimiento de tareas. No permite afirmar causalidad individual
          por estudiante.
        </p>
      </article>
    </div>
  </section>
</template>
