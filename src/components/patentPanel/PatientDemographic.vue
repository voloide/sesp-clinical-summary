<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Page Container -->
    <q-page-container v-if="patient">
      <q-page class="q-pa-none">
        <!-- Header Section -->
        <header-component />

        <!-- Data de Nascimento -->
        <q-card flat bordered class="q-mb-md" v-if="can('IDENT_BIRTHDATE')">
          <q-card-section class="q-py-sm bg-light-green-1 cursor-pointer">
            <div class="col text-weight-bold text-h6">Data de Nascimento</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list dense>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>{{ formattedBirthdate || 'Sem dados' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Endereços -->
        <q-card flat bordered class="q-mb-md" v-if="can('IDENT_ADDRESS')">
          <q-card-section class="q-py-sm bg-light-green-1 cursor-pointer">
            <div class="col text-weight-bold text-h6">Endereços</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list dense>
              <q-item v-for="(address, index) in patient.person.addresses" :key="index">
                <q-item-section>
                  <div class="row items-center q-mb-sm">
                    <div class="col-auto text-weight-bold">Localidade:</div>
                    <div class="col text-caption q-ml-sm" :class="{ 'text-negative': !address.address6 }">
                      {{ address.address6 || 'Sem dados no SESP' }}
                    </div>
                    <q-badge v-if="address.preferred" color="green" text-color="white" class="q-ml-md">
                      Preferido
                    </q-badge>
                  </div>
                  <div class="row items-center q-mb-sm">
                    <div class="col-auto text-weight-bold">Bairro:</div>
                    <div class="col text-caption q-ml-sm" :class="{ 'text-negative': !address.address5 }">
                      {{ address.address5 || 'Sem dados no SESP' }} - {{ address.display }}
                    </div>
                  </div>
                  <div class="row items-center q-mb-sm">
                    <div class="col-auto text-weight-bold">Célula/Bloco:</div>
                    <div class="col text-caption q-ml-sm" :class="{ 'text-negative': !address.address3 }">
                      {{ address.address3 || 'Sem dados no SESP' }}
                    </div>
                  </div>
                  <div class="row items-center q-mb-sm">
                    <div class="col-auto text-weight-bold">Avenida/Rua:</div>
                    <div class="col text-caption q-ml-sm" :class="{ 'text-negative': !address.address1 }">
                      {{ address.address1 || 'Sem dados no SESP' }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Contactos -->
        <q-card flat bordered v-if="can('IDENT_PHONE')">
          <q-card-section class="q-py-sm bg-light-green-1 cursor-pointer">
            <div class="col text-weight-bold text-h6">Contactos</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <q-list dense>
              <q-item v-for="(attribute, index) in filteredAttributes" :key="index">
                <q-item-section>
                  <div class="row items-center">
                    <div class="col-auto text-weight-bold">
                      {{ attribute.attributeType.display }}:
                    </div>
                    <div class="col text-caption q-ml-sm">
                      {{
                        attribute.display.includes('=')
                          ? attribute.display.split('=')[1]?.trim()
                          : attribute.display.trim()
                      }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
              <div v-if="filteredAttributes.length === 0" class="text-caption text-negative">
                Sem dados no SESP
              </div>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Mensagem quando não há qualquer permissão deste bloco -->
        <q-card flat bordered v-if="!can('IDENT_BIRTHDATE') && !can('IDENT_ADDRESS') && !can('IDENT_PHONE')">
          <q-card-section class="text-caption">
            Sem permissões para visualizar dados demográficos.
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, inject, onMounted } from 'vue';
import headerComponent from './headerComponent.vue';

// ⬇️ acesso por variável
import { useAccessControl } from 'src/access/useAccessControl';
const { loadFromSnapshot, can } = useAccessControl();

const patient = inject('selectedPatient');

onMounted(() => {
  try {
    const roles = JSON.parse(sessionStorage.getItem('roles') || '[]');
    loadFromSnapshot(roles.map((r) => r.uuid));
  } catch {
    loadFromSnapshot([]);
  }
});

const formattedBirthdate = computed(() => {
  const birthdate = patient.value?.person?.birthdate;
  if (!birthdate) return null;
  const date = new Date(birthdate);
  return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

// Apenas atributos que contenham "Telefone"
const filteredAttributes = computed(() => {
  return patient.value?.person?.attributes?.filter(
    (attribute) => attribute.attributeType?.display?.includes('Telefone')
  ) || [];
});
</script>

<style scoped>
.q-card { border: 1px solid #e0e0e0; }
.text-lg { font-size: 1.2em; }
.text-h6 { font-size: 1.1em; font-weight: bold; }
</style>
