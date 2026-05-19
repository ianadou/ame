<script setup lang="ts">
withDefaults(defineProps<{ cols?: number; rows?: number }>(), { cols: 5, rows: 8 })
</script>

<template>
  <table class="data-table">
    <thead>
      <tr>
        <th v-for="c in cols" :key="'h' + c">
          <div class="h-2.5 w-16 animate-pulse rounded bg-line/70" />
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="r in rows" :key="r">
        <td v-for="c in cols" :key="r + '-' + c">
          <div
            class="h-3 animate-pulse rounded bg-line/60"
            :class="c === 1 ? 'w-20' : c === cols ? 'w-14' : 'w-32'"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>
