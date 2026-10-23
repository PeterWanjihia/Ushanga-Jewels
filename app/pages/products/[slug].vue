<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)
const { data: product, status, error } = await useFetch(`/api/products/${encodeURIComponent(slug)}`)
const chosenId = ref<string | null>(null)
const chosenVariant = computed(() => product.value?.variants.find(variant => variant.id === chosenId.value) ?? product.value?.variants[0])
const formatPrice = (pence: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP',
}).format(pence / 100)

useSeoMeta({
  title: () => product.value ? `${product.value.name} | Ushanga.Jewels` : 'Collection | Ushanga.Jewels',
  description: () => product.value?.description || 'Explore the Ushanga.Jewels collection.',
})
</script>

<template>
  <main class="detail-section container">
    <div class="breadcrumb"><NuxtLink to="/">Home</NuxtLink> / <NuxtLink to="/#collection">Collection</NuxtLink> / {{ product?.name ?? 'Piece' }}</div>
    <div v-if="status === 'pending'" class="catalog-state" role="status">Loading piece…</div>
    <div v-else-if="error || !product" class="catalog-state" role="alert">
      <h2>Piece not found</h2>
      <p>It may no longer be part of the collection.</p>
      <NuxtLink to="/#collection" class="detail-back">← Back to the collection</NuxtLink>
    </div>
    <div v-else class="detail-layout">
      <div class="detail-art"><span aria-hidden="true">✧</span></div>
      <div class="detail-content">
        <span class="eyebrow">USHANGA JEWELS · THE COLLECTION</span>
        <h1>{{ product.name }}</h1>
        <p class="detail-description">{{ product.description || 'A distinctive piece from the Ushanga.Jewels collection.' }}</p>
        <span class="variant-label">Choose an option</span>
        <div class="variant-list" role="group" aria-label="Available options">
          <button v-for="variant in product.variants" :key="variant.id" type="button" class="variant-option" :aria-pressed="chosenVariant?.id === variant.id" @click="chosenId = variant.id">
            {{ variant.label }}
          </button>
        </div>
        <p v-if="chosenVariant" class="detail-price">{{ formatPrice(chosenVariant.pricePence) }}</p>
        <p v-if="chosenVariant" class="detail-availability">
          {{ chosenVariant.inventoryMode === 'made_to_order' ? 'Made to order' : (chosenVariant.stockOnHand ?? 0) > 0 ? 'Available' : 'Currently out of stock' }}
        </p>
        <p v-if="chosenVariant" class="detail-reference">Reference: {{ chosenVariant.sku }}</p>
        <NuxtLink to="/#collection" class="detail-back">← Continue exploring</NuxtLink>
      </div>
    </div>
  </main>
</template>
