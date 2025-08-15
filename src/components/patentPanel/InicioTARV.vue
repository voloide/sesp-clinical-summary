<template>
  <div class="q-pb-md">
    <!-- Header Section -->
    <header-component />

    <BodyComponent
      title="Dados do Início TARV"
      :loading="loading"
      :summaryData="inicioTARVData"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';
import inicioTarvService from 'src/services/patient/inicioTARVService';
import BodyComponent from './bodyComponent.vue';

// ⬇️ NOVO: controlo de acesso por variável
import { useAccessControl } from 'src/access/useAccessControl';
const { loadFromSnapshot, filterByAccess } = useAccessControl();

const patient = inject('selectedPatient');
const loading = ref(true);
const inicioTARVData = ref([]);
const collapsedSections = ref([]);

function toggleSection(index) {
  collapsedSections.value[index] = !collapsedSections.value[index];
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

onMounted(async () => {
  if (!patient?.value) {
    console.error('Patient data is missing.');
    loading.value = false;
    return;
  }

  // ⬇️ NOVO: carregar permissões a partir dos roles guardados na sessão
  try {
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');
    loadFromSnapshot(roles.map((r) => r.uuid));
  } catch {
    loadFromSnapshot([]);
  }

  try {
    const patientId = patient.value.uuid;

    const [
      ARTStartDate,
      HfARTStart,
      PregnancyAtARTStart,
      WHOStagingAtARTStart,
    ] = await Promise.all([
      inicioTarvService.getARTStartDate(patientId),
      inicioTarvService.getHealthFacilityAtARTStart(patientId),
      inicioTarvService.getPregnancyStatusAtARTStart(patientId),
      inicioTarvService.getWHOStagingAtARTStart(patientId),
    ]);

    // ⬇️ NOVO: sections com permissionKey por variável (Annex)
    const sections = [
      {
        title: 'Data de Início TARV',
        permissionKey: 'ART_START',
        isList: true,
        items:
          ARTStartDate?.length
            ? ARTStartDate.map((item) => ({
                value: formatDate(item.value) || 'Sem dados no SESP',
                source: {
                  form: item.encounter?.form?.display === 'ADULTO: SEGUIMENTO'
                    ? 'FICHA DE SEGUIMENTO'
                    : (item.encounter?.form?.display || 'Sem formulário'),
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '', location: '' } }],
      },
      {
        title: 'Unidade Sanitária de Início TARV',
        permissionKey: 'ART_START_HF',
        isList: true,
        items:
          HfARTStart?.length
            ? HfARTStart.map((item) => ({
                value: item.value || 'Sem dados no SESP',
                source: {
                  form: item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '', location: '' } }],
      },
      {
        title: 'Estado de Gravidez no Início TARV',
        permissionKey: 'ART_START_PREG',
        isList: true,
        items:
          PregnancyAtARTStart?.length
            ? PregnancyAtARTStart.map((item) => ({
                value: item.value?.display || 'Sem dados no SESP',
                source: {
                  form: item.source || item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '', location: '' } }],
      },
      {
        title: 'Estado de OMS no Início TARV',
        permissionKey: 'ART_START_WHO',
        isList: true,
        items:
          WHOStagingAtARTStart?.length
            ? WHOStagingAtARTStart.map((item) => ({
                value: item.value?.display || 'Sem dados no SESP',
                source: {
                  form: item.source || item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '', location: '' } }],
      },
    ];

    // ⬇️ NOVO: aplicar filtro por permissões do utilizador
    const filtered = filterByAccess(sections);

    // Se preferir esconder tudo quando não há nenhuma permissão:
    // inicioTARVData.value = filtered;

    // Ou mostrar um cartão com mensagem:
    inicioTARVData.value = filtered.length ? filtered : [
      {
        title: 'Dados do Início TARV',
        isList: false,
        value: 'Sem permissões para visualizar estes dados',
        source: { form: '', date: '' },
      }
    ];

  } catch (error) {
    console.error('Error fetching Dados Início TARV data:', error);
  } finally {
    loading.value = false;
  }
});
</script>


<style scoped>
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
