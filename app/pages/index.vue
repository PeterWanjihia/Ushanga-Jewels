<script setup lang="ts">
const draftSearch = ref('')
const search = ref('')
const page = ref(1)
const apiQuery = computed(() => ({ q: search.value, page: page.value }))
const { data, status, error } = await useFetch('/api/products', {
  query: apiQuery,
  default: () => ({ items: [], page: 1, total: 0, pageSize: 12 }),
})

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / 12))
const formatPrice = (pence: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP',
}).format(pence / 100)

function searchCatalog() {
  search.value = draftSearch.value.trim()
  page.value = 1
}

useSeoMeta({
  title: 'Ushanga.Jewels | Discover the collection',
  description: 'Explore the Ushanga.Jewels collection. Browse jewellery designs and discover pieces that speak to you.',
})
</script>

<template>
  <main>
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-copy">
          <span class="eyebrow hero-eyebrow">THE USHANGA COLLECTION</span>
          <h1>Jewellery with <em>meaning.</em></h1>
          <p>Find the piece that feels like yours. Explore our collection and discover the details that make every design distinct.</p>
          <a href="#collection" class="button button-light">Explore the collection <span aria-hidden="true">↗</span></a>
        </div>
        <div class="hero-art" aria-hidden="true">
          <div class="hero-orbit orbit-one" />
          <div class="hero-orbit orbit-two" />
          <div class="hero-gem">◆</div>
          <span class="hero-art-caption">FORM · COLOUR · EXPRESSION</span>
        </div>
      </div>
    </section>

    <section id="collection" class="collection-section container">
      <div class="section-heading">
        <div>
          <span class="eyebrow">A CLOSER LOOK</span>
          <h2>Explore the collection</h2>
        </div>
        <p>Search by name, design or reference to find what catches your eye.</p>
      </div>

      <form class="catalog-search" role="search" @submit.prevent="searchCatalog">
        <label for="catalog-query" class="sr-only">Search jewellery</label>
        <span class="search-icon" aria-hidden="true">⌕</span>
        <input id="catalog-query" v-model="draftSearch" type="search" name="q" placeholder="Search jewellery, stones, styles…" maxlength="100" autocomplete="off">
        <button type="submit" class="button button-dark">Search</button>
      </form>

      <div class="results-header">
        <span v-if="status === 'success'">{{ data.total }} {{ data.total === 1 ? 'piece' : 'pieces' }}{{ search ? ` matching “${search}”` : '' }}</span>
        <span v-else-if="status === 'pending'">Loading collection…</span>
        <span v-else>Collection</span>
        <button v-if="search" type="button" class="text-button" @click="draftSearch = ''; searchCatalog()">Clear search ×</button>
      </div>

      <div v-if="status === 'pending'" class="catalog-state" role="status">Discovering the collection…</div>
      <div v-else-if="error" class="catalog-state" role="alert">The collection couldn't be loaded. Please try again shortly.</div>
      <div v-else-if="!data.items.length" class="catalog-state">
        <h3>{{ search ? 'No matching pieces' : 'Our collection is coming together' }}</h3>
        <p>{{ search ? 'Try another name, style, or reference.' : 'Please check back soon to discover our pieces.' }}</p>
      </div>
      <div v-else class="product-grid">
        <NuxtLink v-for="(product, index) in data.items" :key="product.id" class="product-card" :to="`/products/${product.slug}`">
          <div class="product-card-art" :class="`art-tone-${index % 4}`">
            <span class="product-mark" aria-hidden="true">✧</span>
            <span v-if="!product.isAvailable" class="stock-tag">Currently unavailable</span>
          </div>
          <div class="product-card-body">
            <div>
              <span class="product-kicker">USHANGA JEWELS</span>
              <h3>{{ product.name }}</h3>
              <p class="product-price">From {{ formatPrice(product.priceFromPence) }}</p>
            </div>
            <span class="product-card-arrow" aria-hidden="true">↗</span>
          </div>
        </NuxtLink>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <button type="button" :disabled="page <= 1" @click="page--">← Previous</button>
        <span>Page {{ page }} of {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages" @click="page++">Next →</button>
      </div>
    </section>

    <section id="story" class="story-band">
      <div class="container story-inner">
        <span class="eyebrow">OUR APPROACH</span>
        <h2>It's the details that tell the story.</h2>
        <p>Every choice of shape, colour and finish has a character of its own. Explore the collection and find the expression that belongs to you.</p>
      </div>
    </section>
  </main>
</template>
