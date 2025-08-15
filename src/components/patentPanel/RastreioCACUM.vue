<template>
  <div class="q-pb-md">
    <!-- Header Section -->
    <header-component />

    <BodyComponent
      title="Rastreio CACUM"
      :loading="loading"
      :summaryData="rastreioData"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';
import rastreioCACUMService from 'src/services/patient/rastreioCACUM';
import BodyComponent from './bodyComponent.vue';

// ⬇️ NOVO: controlo de acesso por variável
import { useAccessControl } from 'src/access/useAccessControl';
const { loadFromSnapshot, filterByAccess } = useAccessControl();

const patient = inject('selectedPatient');
const loading = ref(true);
const rastreioData = ref([]);
const collapsedSections = ref([]);

function toggleSection(index) {
  collapsedSections.value[index] = !collapsedSections.value[index];
}
function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

onMounted(async () => {
  if (!patient?.value) {
    console.error('Patient data is missing.');
    loading.value = false;
    return;
  }

  // ⬇️ carregar permissões a partir dos roles da sessão
  try {
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');
    loadFromSnapshot(roles.map((r) => r.uuid));
  } catch {
    loadFromSnapshot([]);
  }

  try {
    const patientId = patient.value.uuid;
    const [rastreioCacumData, hPVDNAResultData] = await Promise.all([
      rastreioCACUMService.getRastreioCacumDAta(patientId),
      rastreioCACUMService.getHPVDNAResultData(patientId),
    ]);

    // Secções com permissionKey por variável (Annex)
    const sections = [
      {
        title: 'VIA: Resultado e Data do último rastreio',
        permissionKey: 'VIA',
        isList: true,
        items:
          rastreioCacumData?.length
            ? rastreioCacumData.map((item) => ({
                value: item?.value?.display || 'Sem dados no SESP',
                source: {
                  form: item?.encounter?.form?.display || 'CCU: RASTREIO',
                  date: formatDate(item?.obsDatetime) || 'Sem data',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'CCU: RASTREIO', date: '' } }],
      },
      {
        title: 'Resultado de HPV-DNA',
        permissionKey: 'HPV_DNA',
        isList: true,
        items:
          hPVDNAResultData?.length
            ? hPVDNAResultData.map((item) => ({
                value: item?.value?.display || 'Sem dados no SESP',
                source: {
                  form: item?.encounter?.form?.display || 'CCU: RASTREIO',
                  date: formatDate(item?.encounter?.encounterDatetime) || 'Sem data',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'CCU: RASTREIO', date: '' } }],
      },
    ];

    // Aplicar filtro por permissões
    const filtered = filterByAccess(sections);
    rastreioData.value = filtered.length ? filtered : [
      { title: 'Rastreio CACUM', isList: false, value: 'Sem permissões para visualizar estes dados', source: { form: '', date: '' } }
    ];

  } catch (error) {
    console.error('Error fetching Dados CACUM data:', error);
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
