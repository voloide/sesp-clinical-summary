<template>
  <div class="q-pb-md">
    <!-- Header Section -->
    <header-component />

    <BodyComponent
      title="Confidente"
      :loading="loading"
      :summaryData="rastreioData"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';
import confidenteService from 'src/services/patient/confidente';
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
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

onMounted(async () => {
  if (!patient?.value) {
    console.error('Patient data is missing.');
    loading.value = false;
    return;
  }

  // ⬇️ carregar permissões a partir dos roles guardados na sessão
  try {
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');
    loadFromSnapshot(roles.map((r) => r.uuid));
  } catch {
    loadFromSnapshot([]);
  }

  try {
    const patientId = patient.value.uuid;
    const [confidenteName, confidantContact] = await Promise.all([
      confidenteService.getConfidenteName(patientId),
      confidenteService.getConfidantContact(patientId),
    ]);

    // Secções com permissionKey por variável (Annex)
    const sections = [
      {
        title: 'Nome do Confidente',
        permissionKey: 'CONF_NAME',
        isList: true,
        items:
          confidenteName?.length
            ? confidenteName.map((item) => ({
                value: item?.value || 'Sem dados no SESP',
                source: {
                  form: item?.encounter?.form?.display || 'FICHA RESUMO',
                  date: formatDate(item?.obsDatetime) || 'Sem data',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '' } }],
      },
      {
        title: 'Contacto do Confidente',
        permissionKey: 'CONF_PHONE',
        isList: true,
        items:
          confidantContact?.length
            ? confidantContact.map((item) => ({
                value: item?.value || 'Sem dados no SESP',
                source: {
                  form: item?.encounter?.form?.display || 'FICHA RESUMO',
                  date: formatDate(item?.obsDatetime) || 'Sem data',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA RESUMO', date: '' } }],
      },
    ];

    // Aplicar filtro por permissões
    const filtered = filterByAccess(sections);
    rastreioData.value = filtered.length ? filtered : [
      { title: 'Confidente', isList: false, value: 'Sem permissões para visualizar estes dados', source: { form: '', date: '' } }
    ];

  } catch (error) {
    console.error('Error fetching Dados Confidente:', error);
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
