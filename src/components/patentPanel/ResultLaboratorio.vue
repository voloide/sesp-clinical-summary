<template>
  <div class="q-pb-md">
    <!-- Header Section -->
    <header-component />

    <BodyComponent
      title="Resultados Laboratoriais"
      :loading="loading"
      :summaryData="resultadosData"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';
import resultadosLaboratoriaisService from 'src/services/patient/resultadosLaboratoriaisService';
import BodyComponent from './bodyComponent.vue';
import { useAccessControl } from 'src/access/useAccessControl'; // ⬅️ novo

const { loadFromSnapshot, filterByAccess } = useAccessControl(); // ⬅️ novo

// Inject patient data
const patient = inject('selectedPatient');
const loading = ref(true); // Loading state

// Reactive data for Resultados Laboratoriais
const resultadosData = ref([]);

// Track collapsed states for each section
const collapsedSections = ref([]);

// Helper function to format date to dd-MM-yyyy
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Toggle collapse state for a section
function toggleSection(index) {
  collapsedSections.value[index] = !collapsedSections.value[index];
}

onMounted(async () => {
  if (!patient.value) {
    console.error('Patient data is missing.');
    loading.value = false;
    return;
  }

  try {
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');
    loadFromSnapshot(roles.map((r) => r.uuid));
  } catch { loadFromSnapshot([]); }

  try {
    // ------- CHAMADAS AOS SERVIÇOS (igual ao teu código) -------
    const allCD4CoverageFLG = await resultadosLaboratoriaisService.allCD4CoverageFLG(patient.value.uuid);
    const allCD4CoverageFSR = await resultadosLaboratoriaisService.allCD4CoverageFSR(patient.value.uuid);
    const allCD4AbsFSR      = await resultadosLaboratoriaisService.allCD4AbsFSR(patient.value.uuid);
    const allCD4AbsFLG      = await resultadosLaboratoriaisService.allCD4AbsFLG(patient.value.uuid);
    const allGenexpert      = await resultadosLaboratoriaisService.allGenexpert(patient.value.uuid);
    const allGenexpertFC    = await resultadosLaboratoriaisService.allGenexpertFC(patient.value.uuid);
    const allBaciloscopia   = await resultadosLaboratoriaisService.allBaciloscopia(patient.value.uuid);
    const allBaciloscopiaFC = await resultadosLaboratoriaisService.allBaciloscopiaFC(patient.value.uuid);
    const { rastreioTBLAMLabGeral, rastreioTBLAMELab, rastreioTBLAMFichaClinica } =
      await resultadosLaboratoriaisService.allTBLAM(patient.value.uuid);
    const allHGB = await resultadosLaboratoriaisService.allHGB(patient.value.uuid);
    const allAST = await resultadosLaboratoriaisService.allAST(patient.value.uuid);
    const allALT = await resultadosLaboratoriaisService.allALT(patient.value.uuid);
    const allAMI = await resultadosLaboratoriaisService.allAMI(patient.value.uuid);
    const allGLC = await resultadosLaboratoriaisService.allGLC(patient.value.uuid);
    const allPCR = await resultadosLaboratoriaisService.allPCR(patient.value.uuid);
    const allVLs = await resultadosLaboratoriaisService.allVLs(patient.value.uuid);

    // ------- SECTIONS COM PERMISSION KEYS (apenas acrescentámos permissionKey) -------
    const sections = [
      {
        title: 'Carga Viral (Cópias/ml)',
        permissionKey: 'VL',
        isList: true,
        items: allVLs.length > 0
          ? allVLs.map((item) => ({
              value: `${item.value?.display ?? item.value ?? ''} ${item.comment ? item.comment : ''}`.trim() || 'Sem dados no SESP',
              source: {
                form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB'
                     : item.encounter?.form?.display || 'Sem dados no SESP',
                date: formatDate(item.obsDatetime) || '',
              },
            }))
          : [{ value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } }],
      },
      {
        title: 'CD4 Absoluto',
        permissionKey: 'CD4_ABS',
        isList: true,
        items:
          (allCD4AbsFLG.length || allCD4AbsFSR.length)
            ? [
                ...allCD4AbsFLG.map((item) => ({
                  value: item?.value || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'LABORATORIO GERAL'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
                ...allCD4AbsFSR.map((item) => ({
                  value: item.value || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'E-LAB'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
              ]
            : [
                { value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'e-Lab', date: '' } },
              ],
      },
      {
        title: 'CD4 Percentual',
        permissionKey: 'CD4_PCT',
        isList: true,
        items:
          (allCD4CoverageFLG.length || allCD4CoverageFSR.length)
            ? [...allCD4CoverageFLG, ...allCD4CoverageFSR]
                .filter((i) => i?.obsDatetime)
                .map((i) => ({ ...i, parsedDate: new Date(i.obsDatetime) }))
                .sort((a, b) => b.parsedDate - a.parsedDate)
                .map((item) => ({
                  value: item.value || 'Sem dados no SESP',
                  source: {
                    form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO'
                      ? 'e-LAB'
                      : item.encounter?.form?.display || (allCD4CoverageFLG.includes(item) ? 'LABORATORIO GERAL' : 'e-LAB'),
                    date: formatDate(item.obsDatetime) || '',
                  },
                }))
            : [
                { value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'e-Lab', date: '' } },
              ],
      },
      {
        title: 'GeneXpert',
        permissionKey: 'TB_GENEXPERT',
        isList: true,
        items:
          (allGenexpert.length || allGenexpertFC.length)
            ? [
                ...allGenexpert.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'LABORATORIO GERAL'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
                ...allGenexpertFC.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display || 'FICHA CLINICA',
                            date: formatDate(item.obsDatetime) || '' },
                })),
              ]
            : [
                { value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '' } },
              ],
      },
      {
        title: 'Baciloscopia',
        permissionKey: 'TB_BACILOSCOPIA',
        isList: true,
        items:
          (allBaciloscopia.length || allBaciloscopiaFC.length)
            ? [
                ...allBaciloscopia.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'LABORATORIO GERAL'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
                ...allBaciloscopiaFC.map((item) => ({
                  value: item.value || 'Sem dados no SESP',
                  source: { form: item.encounter?.form?.display || 'FICHA CLINICA',
                            date: formatDate(item.obsDatetime) || '' },
                })),
              ]
            : [
                { value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '' } },
              ],
      },
      {
        title: 'TB LAM',
        permissionKey: 'TB_LAM',
        isList: true,
        items:
          (rastreioTBLAMLabGeral.length || rastreioTBLAMELab.length || rastreioTBLAMFichaClinica.length)
            ? [
                ...rastreioTBLAMLabGeral.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  comment: item.value?.comment ? 'Nível de Positividade: ' + item.value.comment : '',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'LABORATORIO GERAL'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
                ...rastreioTBLAMELab.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  comment: item.value?.comment || '',
                  source: { form: item.encounter?.form?.display === 'FORMULARIO ELECTRONICO DE LABORATORIO' ? 'e-LAB' : (item.encounter?.form?.display || 'e-LAB'),
                            date: formatDate(item.obsDatetime) || '' },
                })),
                ...rastreioTBLAMFichaClinica.map((item) => ({
                  value: item.value?.display || 'Sem dados no SESP',
                  comment: item.value?.comment || '',
                  source: { form: item.encounter?.form?.display || 'FICHA CLINICA',
                            date: formatDate(item.obsDatetime) || '' },
                })),
              ]
            : [
                { value: 'Sem dados no SESP', source: { form: 'LABORATORIO GERAL', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'e-LAB', date: '' } },
                { value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '' } },
              ],
      },
      { title: 'Hemoglobina (HGB ou HB)',        permissionKey: 'LAB_HGB', isList: true, items: allHGB.length ? allHGB.map((it)=>({ value: it.value||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
      { title: 'Aspartato Aminotransferase',     permissionKey: 'LAB_AST', isList: true, items: allAST.length ? allAST.map((it)=>({ value: it.value||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
      { title: 'Alanina Aminotransferase',       permissionKey: 'LAB_ALT', isList: true, items: allALT.length ? allALT.map((it)=>({ value: it.value||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
      { title: 'Amilase (AMI)',                  permissionKey: 'LAB_AMI', isList: true, items: allAMI.length ? allAMI.map((it)=>({ value: it.value||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
      { title: 'Glucose (GLC)',                  permissionKey: 'LAB_GLC', isList: true, items: allGLC.length ? allGLC.map((it)=>({ value: it.value||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
      { title: 'PCR',                            permissionKey: 'LAB_PCR', isList: true, items: allPCR.length ? allPCR.map((it)=>({ value: it.value?.display||'Sem dados no SESP', source:{ form: it.encounter?.form?.display==='FORMULARIO ELECTRONICO DE LABORATORIO'?'E-LAB':(it.encounter?.form?.display||'LABORATORIO GERAL'), date: formatDate(it.obsDatetime)||'Sem data' } })) : [{ value:'Sem dados no SESP', source:{ form:'LABORATORIO GERAL', date:'' } }] },
    ];

    // ⬅️ aplica o filtro por permissões ANTES de enviar para o BodyComponent
    resultadosData.value = filterByAccess(sections);

  } catch (error) {
    console.error('Error fetching Resultados Laboratoriais:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
/* Ajuste para estilizar o cabeçalho com fundo cinza */
.bg-grey-3 {
  background-color: #e0e0e0;
}
.q-th {
  text-align: center;
}
.q-card {
  border: 1px solid #e0e0e0;
}
.text-h6 {
  font-size: 1.1em;
}
.text-caption {
  font-size: 0.9em;
}
</style>
