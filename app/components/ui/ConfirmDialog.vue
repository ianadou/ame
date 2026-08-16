<script setup lang="ts">
interface Props {
  title: string
  // Ce que l'action fait réellement, pas « êtes-vous sûr ». Les modales
  // d'archivage et d'ajustement de l'app énoncent déjà leurs conséquences ;
  // les suppressions, elles, partaient sans rien demander.
  message: string
  confirmLabel?: string
  loading?: boolean
  // Nom de l'objet visé, répété pour que l'utilisateur vérifie sa cible.
  cible?: string
}

withDefaults(defineProps<Props>(), {
  confirmLabel: 'Supprimer',
  loading: false,
  cible: '',
})

const emit = defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <AppModal v-model:open="open" :title="title">
    <div class="space-y-3">
      <p v-if="cible" class="rounded-md bg-paper-2 px-3 py-2.5 text-sm font-medium text-ink">
        {{ cible }}
      </p>
      <p class="text-sm text-muted">{{ message }}</p>
      <slot />
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="open = false">Retour</AppButton>
      <AppButton variant="danger" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
