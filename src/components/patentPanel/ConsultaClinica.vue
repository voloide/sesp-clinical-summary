<template>
  <div class="q-pb-md">
    <!-- Header Section -->
    <header-component />

    <BodyComponent
      title="Dados da Consulta Clínica"
      :loading="loading"
      :summaryData="consultaClinicaData"
      @toggle-section="toggleSection"
    />
  </div>
</template>

<script setup>
import { inject, ref, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';
import consultaClinicaService from 'src/services/patient/ConsultaClinicaService';
import BodyComponent from './bodyComponent.vue';

// ⬇️ NOVO: controlo de acesso por variável
import { useAccessControl } from 'src/access/useAccessControl';
const { loadFromSnapshot, filterByAccess } = useAccessControl();

const patient = inject('selectedPatient');
const loading = ref(true); // Loading state
const consultaClinicaData = ref([]);
const collapsedSections = ref([]);

function toggleSection(index) {
  collapsedSections.value[index] = !collapsedSections.value[index];
}

function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Fetch Clinical Consultation Data
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
      mostRecentConsultation,
      nextAppointment,
      weight,
      height,
      bmi,
      mds,              // (DSD)
      pregnancy,        // Provenance: Pregnant at last clinical consultation
      breastfeeding,    // Provenance: Breastfeeding at last clinical consultation
      programEnrollment // Provenance: Last State from Program Enrollment
    ] = await Promise.all([
      consultaClinicaService.getMostRecentConsultation(patientId),
      consultaClinicaService.getNextAppointment(patientId),
      consultaClinicaService.getWeight(patientId),
      consultaClinicaService.getHeight(patientId),
      consultaClinicaService.getBMI(patientId),
      consultaClinicaService.getMDS(patientId),
      consultaClinicaService.getPregnancyStatus(patientId),
      consultaClinicaService.getBreastfeedingStatus(patientId),
      consultaClinicaService.getProgramEnrollment(patientId),
    ]);

    // ⬇️ NOVO: sections com permissionKey por variável (Annex)
    const sections = [
      {
        title: 'Data da consulta mais recente',
        permissionKey: 'CONSULT_LAST',
        isList: true,
        items:
          mostRecentConsultation.length > 0
            ? mostRecentConsultation.map((item) => ({
                value: formatDate(item.encounterDatetime) || 'Sem dados no SESP',
                source: {
                  form: item.form?.display || 'Sem formulário',
                  date: formatDate(item.encounterDatetime) || 'Sem data',
                  location: item.location?.display || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Data da próxima consulta',
        permissionKey: 'CONSULT_NEXT',
        isList: true,
        items:
          nextAppointment.length > 0
            ? nextAppointment.map((item) => ({
                value: formatDate(item.value) || 'Sem dados no SESP',
                source: {
                  form: item.source || item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Peso',
        permissionKey: 'ANTROP_WEIGHT',
        isList: true,
        items:
          weight.length > 0
            ? weight.map((item) => ({
                value: item.value ?? 'Sem dados no SESP',
                source: {
                  form: item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Altura',
        permissionKey: 'ANTROP_HEIGHT',
        isList: true,
        items:
          height.length > 0
            ? height.map((item) => ({
                value: item.value ?? 'Sem dados no SESP',
                source: {
                  form: item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'BMI',
        permissionKey: 'ANTROP_BMI',
        isList: true,
        items:
          bmi.length > 0
            ? bmi.map((item) => ({
                value: item.value ?? 'Sem dados no SESP',
                source: {
                  form: item.encounter?.form?.display || 'Sem formulário',
                  date: formatDate(item.obsDatetime) || 'Sem data',
                  location: item.encounter?.location?.name || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'MDS',
        permissionKey: 'DSD',
        isList: true,
        items:
          mds.length > 0
            ? mds.map((item) => ({
                value: `${item.mds ?? 'MDS não especificado'}${item.state ? ` (${item.state})` : ''}`,
                source: {
                  form: item.source || 'Sem formulário',
                  date: formatDate(item.date) || 'Sem data',
                  location: item.hf || 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Gravidez na última consulta clínica',
        permissionKey: 'PROV_PREG_AT_LAST',
        isList: true,
        items:
          pregnancy.length > 0
            ? [{
                value: pregnancy[0].value?.display || 'Sem dados no SESP',
                source: {
                  form: pregnancy[0].encounter?.form?.display || 'Sem formulário',
                  date: formatDate(pregnancy[0].obsDatetime) || 'Sem data',
                  location: pregnancy[0].encounter?.location?.name || 'Sem localidade',
                },
              }]
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Lactante na última consulta clínica',
        permissionKey: 'PROV_BF_AT_LAST',
        isList: true,
        items:
          breastfeeding.length > 0
            ? [{
                value: breastfeeding[0].value?.display || 'Sem dados no SESP',
                source: {
                  form: breastfeeding[0].encounter?.form?.display || 'Sem formulário',
                  date: formatDate(breastfeeding[0].obsDatetime) || 'Sem data',
                  location: breastfeeding[0].encounter?.location?.name || 'Sem localidade',
                },
              }]
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
      {
        title: 'Programa',
        permissionKey: 'PROV_LAST_STATE', // "Provenance: Last State from Program Enrollment"
        isList: true,
        items:
          programEnrollment.length > 0
            ? programEnrollment.map((item) => ({
                value: item.program || 'Sem dados no SESP',
                source: {
                  form: item.states || 'Sem estado',
                  date: formatDate(item.stateDate) || 'Sem data',
                  location: 'Sem localidade',
                },
              }))
            : [{ value: 'Sem dados no SESP', source: { form: 'FICHA CLINICA', date: '', location: '' } }],
      },
    ];

    // ⬇️ NOVO: aplicar filtro por permissões do utilizador
    const filtered = filterByAccess(sections);
    consultaClinicaData.value = filtered.length ? filtered : [
      { title: 'Dados da Consulta Clínica', isList: false, value: 'Sem permissões para visualizar estes dados', source: { form: '', date: '' } }
    ];

  } catch (error) {
    console.error('Error fetching clinical consultation data:', error);
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
