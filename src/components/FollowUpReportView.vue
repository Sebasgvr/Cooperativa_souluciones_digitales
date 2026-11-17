<script setup>
import { ref, computed } from 'vue'
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Database,
  FileText,
  Info,
  Printer,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'
import Button from './ui/Button.vue'
import CustomSelect from './ui/CustomSelect.vue'
import CooperativaVisualizations from './CooperativaVisualizations.vue'
import { KPI_PERIODS } from '../data/cooperativaModels.js'

const props = defineProps({
  isSupabaseConnected: {
    type: Boolean,
    default: false,
  },
  lastUpdated: {
    type: String,
    default: '',
  },
  currentRoleLabel: {
    type: String,
    default: 'Consejo de Administración',
  },
  totalRequests: {
    type: Number,
    default: 4,
  },
  totalProjects: {
    type: Number,
    default: 4,
  },
})

const selectedPeriodId = ref('octubre_2026')
const selectedAudience = ref('todos')

const activePeriod = computed(
  () => KPI_PERIODS.find((p) => p.id === selectedPeriodId.value) || KPI_PERIODS[0]
)

const reportMetaByPeriod = {
  octubre_2026: {
    metSummary:
      'Se cumplieron 3 de 4 metas pautadas (75%): TEUP alcanzó 85.0% (dentro del rango óptimo 75%–85%), IASS obtuvo 85.0% (igualando la meta ≥ 85.0%) e IPEC llegó a 90.0% (superando la meta ≥ 85.0% con 18 de 20 socios activos).',
    difficulties:
      'El indicador PDFT registró 13.3% (8 defectos en 60 casos ejecutados), superando el límite máximo aceptable de 10.0%. El desvío se concentró en PR-002 (Gestor Horarios Laboratorio: 5 bugs sobre 35 casos) por validaciones faltantes en formularios y vistas móviles.',
    patterns:
      'Entre agosto y octubre de 2026 se observa una tendencia sostenida de mejora: TEUP subió de 70.0% a 85.0%, IPEC creció de 80.0% a 90.0% y PDFT bajó de 18.2% a 13.3%, aunque aún no alcanza el umbral verde (≤ 10%).',
    needsMoreData:
      'El IASS se calcula actualmente sobre 2 proyectos evaluados (N = 20 puntos máximos). Se requiere acumular al menos 5 entregas homologadas en el ciclo lectivo para confirmar si la satisfacción ≥ 85% se mantiene estable ante solicitudes de mayor complejidad.',
    actions: [
      {
        title: 'Acción 1 · Checklist obligatorio de pre-entrega técnica (Objetivo: bajar PDFT a ≤ 10%)',
        responsible: 'Comisión de Programación + Comisión de Pruebas y Calidad (QA)',
        basis:
          'Los 8 defectos detectados en octubre surgieron principalmente por campos sin validar y quiebres responsivos antes de pasar a testing formal. Exigir una lista de 6 controles previos por el referente reduce los rebotes en QA.',
        timeline: 'Implementación inmediata en el Sprint #07 (Noviembre 2026).',
      },
      {
        title: 'Acción 2 · Tutoría entre pares y redistribución preventiva de tareas (Objetivo: sostener IPEC ≥ 85%)',
        responsible: 'Docente Asesor/a + Secretaría del Consejo',
        basis:
          'Aunque IPEC alcanzó 90.0%, el desglose muestra 2 socios en seguimiento (S-07 y S-14) y menor dotación en Comunicación (1/2 activo). Asignar duplas de acompañamiento evita la deserción estudiantil y equilibra la carga.',
        timeline: 'Tratamiento en la próxima Asamblea General Ordinaria.',
      },
    ],
  },
  septiembre_2026: {
    metSummary:
      'Se cumplieron 3 de 4 metas: TEUP en 78.8%, IASS en 90.0% (impulsado por la entrega de PR-004 Biblioteca) e IPEC en 85.0%.',
    difficulties:
      'PDFT se ubicó en 15.0% (6 defectos en 40 casos), evidenciando falta de criterios uniformes al probar formularios.',
    patterns:
      'Mayor estabilidad horaria en el laboratorio respecto de agosto (+8.8 puntos en TEUP) gracias al ajuste de turnos.',
    needsMoreData:
      'Solo se evaluó 1 solución entregada en septiembre (N = 10 puntos); la muestra de satisfacción aún no es representativa del resto de las áreas escolares.',
    actions: [
      {
        title: 'Acción 1 · Estandarizar casos de prueba QA por tipo de solución',
        responsible: 'Comisión de Pruebas y Calidad (QA)',
        basis: 'Reducir la tasa de defectos funcionales desde el 15.0% hacia el límite de 10.0%.',
        timeline: 'Octubre 2026.',
      },
      {
        title: 'Acción 2 · Reforzar incorporación en Comunicación',
        responsible: 'Consejo de Administración',
        basis: 'Evitar sobrecarga en los 2 integrantes de la comisión.',
        timeline: 'Octubre 2026.',
      },
    ],
  },
  agosto_2026: {
    metSummary:
      'Mes de puesta en marcha: ningún indicador alcanzó aún la zona verde definitiva (TEUP 70.0%, IPEC 80.0%, PDFT 18.2% e IASS sin entregas).',
    difficulties:
      'Superposición de horarios de contraturno y ausencia de guías previas de validación en los primeros prototipos.',
    patterns:
      'Alta demanda inicial de relevamiento (4 solicitudes ingresadas), pero baja madurez técnica en pruebas exploratorias.',
    needsMoreData:
      'Sin entregas finalizadas en agosto (denominador IASS = 0); no es posible evaluar satisfacción comunitaria en este corte.',
    actions: [
      {
        title: 'Acción 1 · Reorganizar grilla de turnos del Laboratorio',
        responsible: 'Tesorería + Administrador Técnico de Sala',
        basis: 'Elevar TEUP de 70.0% al rango óptimo 75%–85%.',
        timeline: 'Septiembre 2026.',
      },
      {
        title: 'Acción 2 · Inducción técnica por comisión',
        responsible: 'Referentes de Comisión',
        basis: 'Integrar a los 4 socios pendientes de asignación efectiva.',
        timeline: 'Septiembre 2026.',
      },
    ],
  },
  receso_sin_datos: {
    metSummary:
      'Período sin actividad ordinaria (prueba de denominador cero). Ningún KPI resulta calculable algebraicamente.',
    difficulties:
      'Sin dificultades operativas: el sistema demuestra que ante denominadores nulos no inventa porcentajes 0% ni errores NaN.',
    patterns: 'No aplica análisis de tendencia en cortes sin registros.',
    needsMoreData: 'Requiere reanudación del ciclo lectivo y registro de horas/casos reales.',
    actions: [
      {
        title: 'Acción 1 · Verificar disponibilidad del laboratorio antes del reinicio',
        responsible: 'Administrador Técnico de Sala',
        basis: 'Asegurar PCs operativas y credenciales Supabase activas previo al nuevo período.',
        timeline: 'Inicio del próximo mes hábil.',
      },
      {
        title: 'Acción 2 · Convocar reunión preparatoria del Consejo',
        responsible: 'Presidencia y Secretaría',
        basis: 'Priorizar solicitudes pendientes en bandeja "Por evaluar".',
        timeline: 'Primera semana de actividad.',
      },
    ],
  },
}

const currentInterpretation = computed(
  () => reportMetaByPeriod[selectedPeriodId.value] || reportMetaByPeriod.octubre_2026
)

const kpiRows = computed(() => {
  const vals = activePeriod.value.values
  return [
    { code: 'TEUP', name: 'Uso de Puestos de Cómputo', target: '75% – 85%', ...vals.TEUP },
    { code: 'IASS', name: 'Satisfacción del Solicitante', target: '≥ 85.0%', ...vals.IASS },
    { code: 'PDFT', name: 'Defectos Funcionales en Testing', target: '≤ 10.0%', ...vals.PDFT },
    { code: 'IPEC', name: 'Participación Equitativa y Cumplimiento', target: '≥ 85.0%', ...vals.IPEC },
  ]
})

function handlePrint() {
  window.print()
}
</script>

<template>
  <div class="report-shell">
    <!-- CABECERA DEL INFORME DE SEGUIMIENTO -->
    <div class="report-header-card">
      <div class="report-header-top">
        <div>
          <span class="eyebrow">INFORME DE SEGUIMIENTO PERIÓDICO · COOPERATIVA ESCOLAR</span>
          <h2>Informe Mensual de Gestión, Indicadores y Decisiones</h2>
          <p class="report-lead">
            A diferencia del tablero de consulta rápida, este informe explica un período completo,
            documenta sus fuentes, resume resultados y fundamenta acciones de mejora para la Asamblea.
          </p>
        </div>
        <div class="report-controls no-print">
          <div class="report-select-wrap" style="border: 0; background: transparent; padding: 0">
            <span><CalendarDays :size="14" /> Período:</span>
            <CustomSelect
              v-model="selectedPeriodId"
              :options="KPI_PERIODS.map((p) => ({ value: p.id, label: p.label }))"
              style="min-width: 200px"
            />
          </div>
          <Button variant="default" size="sm" @click="handlePrint">
            <Printer :size="15" />
            <span>Imprimir / Guardar PDF</span>
          </Button>
        </div>
      </div>

      <!-- FICHA DE METADATOS DEL INFORME -->
      <div class="report-meta-grid">
        <div class="report-meta-item">
          <FileText :size="16" />
          <div>
            <span>OBJETIVO DEL INFORME</span>
            <strong>Evaluar el desempeño operativo, técnico y cooperativo de {{ activePeriod.shortLabel }} para respaldar decisiones de mejora en Asamblea.</strong>
          </div>
        </div>
        <div class="report-meta-item">
          <Database :size="16" />
          <div>
            <span>FUENTE DE DATOS Y FRECUENCIA</span>
            <strong>
              {{ isSupabaseConnected ? 'Supabase PostgreSQL (en vivo)' : 'Dataset piloto simulado en sistema' }}
              · Frecuencia: Mensual ({{ totalRequests }} solicitudes, {{ totalProjects }} proyectos).
            </strong>
          </div>
        </div>
        <div class="report-meta-item">
          <Users :size="16" />
          <div>
            <span>QUIÉN PUEDE CONSULTARLO (AUDIENCIA)</span>
            <strong>
              Consejo de Administración, Sindicatura Escolar, Docentes Asesores y Socios en Asamblea
              (rol activo: {{ currentRoleLabel }}). Versión pública expone solo IASS y entregas.
            </strong>
          </div>
        </div>
        <div class="report-meta-item">
          <ShieldCheck :size="16" />
          <div>
            <span>ESTADO DE ACTUALIZACIÓN</span>
            <strong>{{ lastUpdated || 'Actualizado al abrir el módulo' }} · Emisión formal del cierre de período.</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- TABLA RESUMEN DEL PERÍODO -->
    <section class="report-block">
      <div class="report-block-head">
        <span class="kpi-subtitle-eyebrow">1. RESULTADOS DE INDICADORES (KPI) Y METAS DEL PERÍODO</span>
        <h3>Tabla Resumen — {{ activePeriod.label }}</h3>
      </div>

      <div class="table-responsive">
        <table class="kpi-matrix-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Indicador</th>
              <th>Meta Pautada</th>
              <th>Resultado</th>
              <th>Fórmula / Cálculo del período</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in kpiRows" :key="row.code" :class="row.statusType === 'danger' ? 'row-danger-highlight' : ''">
              <td><strong>{{ row.code }}</strong></td>
              <td>{{ row.name }}</td>
              <td><span class="meta-pill">{{ row.target }}</span></td>
              <td>
                <strong :class="['actual-value-text', row.statusType]">{{ row.formatted }}</strong>
              </td>
              <td>
                <div style="font-size: 0.85rem; color: var(--muted-foreground)">
                  {{ row.math }}
                </div>
              </td>
              <td>
                <span :class="['status-display-badge', row.statusType]">
                  <span class="badge-indicator" />
                  <span class="badge-text">{{ row.statusLabel }}</span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- VISUALIZACIONES REUTILIZADAS -->
    <section class="report-block">
      <div class="report-block-head">
        <span class="kpi-subtitle-eyebrow">2. GRÁFICOS DE RESPALDO (REUTILIZADOS DEL SISTEMA)</span>
        <h3>Visualizaciones del Período {{ activePeriod.shortLabel }}</h3>
      </div>
      <CooperativaVisualizations
        :period="activePeriod"
        :selected-audience="selectedAudience"
        compact
      />
    </section>

    <!-- INTERPRETACIÓN Y DECISIONES DE MEJORA -->
    <section class="report-block">
      <div class="report-block-head">
        <span class="kpi-subtitle-eyebrow">3. INTERPRETACIÓN ANALÍTICA Y ACCIONES DE MEJORA</span>
        <h3>Lectura del Período y Plan de Acción Fundamentado</h3>
      </div>

      <div class="report-analysis-grid">
        <div class="report-analysis-card ok">
          <div class="report-card-title">
            <CheckCircle2 :size="18" />
            <h4>Metas cumplidas</h4>
          </div>
          <p>{{ currentInterpretation.metSummary }}</p>
        </div>

        <div class="report-analysis-card warn">
          <div class="report-card-title">
            <AlertTriangle :size="18" />
            <h4>Dificultades y desvíos detectados</h4>
          </div>
          <p>{{ currentInterpretation.difficulties }}</p>
        </div>

        <div class="report-analysis-card info">
          <div class="report-card-title">
            <Info :size="18" />
            <h4>Patrones observados</h4>
          </div>
          <p>{{ currentInterpretation.patterns }}</p>
        </div>

        <div class="report-analysis-card neutral">
          <div class="report-card-title">
            <Info :size="18" />
            <h4>Límites de los datos (qué requiere más evidencia)</h4>
          </div>
          <p>{{ currentInterpretation.needsMoreData }}</p>
        </div>
      </div>

      <div class="report-actions-list">
        <h4>Acciones de mejora propuestas para el próximo período</h4>
        <div v-for="(act, idx) in currentInterpretation.actions" :key="idx" class="report-action-item">
          <strong>{{ act.title }}</strong>
          <p>{{ act.basis }}</p>
          <div class="report-action-meta">
            <span><strong>Responsable:</strong> {{ act.responsible }}</span>
            <span><strong>Plazo:</strong> {{ act.timeline }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
