<script setup lang="ts">
const route = useRoute()

const search = computed(() => typeof route.query.q === 'string' ? route.query.q.trim() : '')
const page = computed(() => {
  const raw = route.query.page
  return typeof raw === 'string' && /^[1-9][0-9]{0,4}$/.test(raw) && Number(raw) <= 10000
    ? Number(raw)
    : 1
})
const invalidFilters = computed(() => {
  const q = route.query.q
  const p = route.query.page
  return (q !== undefined && (typeof q !== 'string' || q.trim().length > 100))
    || (p !== undefined && (typeof p !== 'string' || !/^[1-9][0-9]{0,4}$/.test(p) || Number(p) > 10000))
})

const draftSearch = ref(search.value)
watch(search, value => { draftSearch.value = value })

const apiQuery = computed(() => ({ q: search.value, page: page.value }))
const { data, status, error, refresh } = await useFetch('/api/products', {
  query: apiQuery,
  default: () => ({ items: [], page: 1, total: 0, pageSize: 12, currency: 'GBP' as const }),
})

const totalPages = computed(() => Math.ceil((data.value?.total ?? 0) / (data.value?.pageSize ?? 12)))
const hasInputError = computed(() => invalidFilters.value || error.value?.statusCode === 400)
const formatPrice = (pence: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP',
}).format(pence / 100)

function showPage(value: number) {
  return navigateTo({
    path: '/',
    query: { ...(search.value ? { q: search.value } : {}), page: String(value) },
    hash: '#collection',
  })
}

function searchCatalog() {
  const q = draftSearch.value.trim()
  return navigateTo({ path: '/', query: q ? { q } : {}, hash: '#collection' })
}

function clearSearch() {
  draftSearch.value = ''
  return navigateTo({ path: '/', hash: '#collection' })
}

useSeoMeta({
  title: 'Ushanga.Jewels | Discover the collection',
  description: 'Explore the Ushanga.Jewels collection. Discover jewellery through form, colour, and personal expression.',
})
</script>

<template>
  <main class="atelier-page">
    <section class="editorial-hero" aria-labelledby="hero-title">
      <div class="editorial-hero-inner">
        <div class="hero-intro">
          <div class="hero-intro-top"><span class="mini-rule" aria-hidden="true" /><span class="eyebrow">USHANGA.JEWELS &nbsp; / &nbsp; THE COLLECTION</span></div>
          <h1 id="hero-title">Pieces to<br>keep <em>close.</em></h1>
          <p class="hero-description">A collection of colour, character, and considered details. Find the piece that feels unmistakably yours.</p>
          <a class="hero-link" href="#collection">Explore the collection <span class="circle-arrow" aria-hidden="true">↗</span></a>
          <div class="hero-footnote"><span>01 / 02</span><span>AN EXPLORATION OF FORM &amp; FEELING</span></div>
        </div>
        <div class="hero-stage" role="img" aria-label="Illustrative gold pendant against a warm stone background">
          <span class="hero-watermark" aria-hidden="true">U.</span>
          <svg class="hero-jewel" viewBox="0 0 580 620" fill="none" aria-hidden="true">
            <defs>
              <linearGradient id="uj-gold" x1="98" y1="82" x2="469" y2="442" gradientUnits="userSpaceOnUse">
                <stop stop-color="#fff6d8"/><stop offset=".26" stop-color="#a6763e"/><stop offset=".52" stop-color="#f1d498"/><stop offset=".75" stop-color="#a57539"/><stop offset="1" stop-color="#f9e5b9"/>
              </linearGradient>
              <radialGradient id="uj-stone" cx="0" cy="0" r="1" gradientTransform="translate(269 348) rotate(46) scale(112 156)" gradientUnits="userSpaceOnUse">
                <stop stop-color="#ffecc0"/><stop offset=".45" stop-color="#ce965c"/><stop offset="1" stop-color="#71402e"/>
              </radialGradient>
              <filter id="uj-shadow" x="-60%" y="-60%" width="220%" height="240%"><feDropShadow dx="14" dy="21" stdDeviation="12" flood-color="#4b3828" flood-opacity=".28"/></filter>
            </defs>
            <ellipse cx="303" cy="533" rx="181" ry="24" fill="#574d3d" opacity=".11"/>
            <path d="M99 90C114 238 199 333 292 337C388 341 476 221 484 77" stroke="#554633" stroke-width="16" opacity=".13" stroke-linecap="round"/>
            <path d="M96 83C114 230 199 323 292 327C388 331 473 213 482 72" stroke="url(#uj-gold)" stroke-width="9" stroke-linecap="round"/>
            <path d="M108 92C126 227 201 315 292 319C379 322 458 216 471 87" stroke="#f5e0ad" stroke-width="1.7" stroke-linecap="round" opacity=".9"/>
            <g filter="url(#uj-shadow)" transform="rotate(-9 290 401)">
              <path d="M286 322C267 352 233 380 234 423C236 464 255 503 288 509C322 505 347 462 348 422C348 383 308 350 295 322C292 315 289 315 286 322Z" fill="url(#uj-stone)" stroke="#f7db98" stroke-width="9"/>
              <path d="M291 341C274 381 248 394 251 428C255 464 271 482 289 490" stroke="#ffe5b8" stroke-width="5" opacity=".55" stroke-linecap="round"/>
              <circle cx="291" cy="326" r="13" fill="url(#uj-gold)" stroke="#f6dda5" stroke-width="4"/>
            </g>
          </svg>
          <div class="hero-stage-bottom"><span>FORM STUDY / 001</span><span>ILLUSTRATIVE CONCEPT</span></div>
        </div>
      </div>
    </section>

    <div class="chapter-strip" aria-hidden="true"><span>COLOUR</span><i>✦</i><span>FORM</span><i>✦</i><span>EXPRESSION</span><i>✦</i><span>DETAIL</span></div>

    <section id="collection" class="collection-section atelier-container" :aria-busy="status === 'pending'">
      <div class="section-heading collection-intro">
        <div><span class="eyebrow">01 &nbsp; / &nbsp; THE EDIT</span><h2>Find your <em>piece.</em></h2></div>
        <p>A closer look at the collection. Explore by name, design, or reference to discover what speaks to you.</p>
      </div>

      <form class="catalog-search" role="search" @submit.prevent="searchCatalog">
        <label for="catalog-query" class="sr-only">Search jewellery</label>
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg>
        <input id="catalog-query" v-model="draftSearch" type="search" name="q" placeholder="Search pieces, styles, references…" maxlength="100" autocomplete="off">
        <button type="submit" class="search-submit">Search <span aria-hidden="true">↗</span></button>
      </form>

      <div class="demo-notice" role="note"><span class="notice-pip" aria-hidden="true"/><p><strong>Development catalogue:</strong> Products labelled DEMO contain sample details, prices, and illustrative placeholders.</p></div>

      <div class="results-header" aria-live="polite">
        <span v-if="status === 'success' && !hasInputError"><strong>{{ data.total }}</strong> {{ data.total === 1 ? 'piece' : 'pieces' }}{{ search ? ` for “${search}”` : ' in the collection' }}</span>
        <span v-else-if="status === 'pending' && !hasInputError">Finding your pieces…</span>
        <span v-else>THE COLLECTION</span>
        <button v-if="search || route.query.page" type="button" class="reset-button" @click="clearSearch">Clear search <span aria-hidden="true">×</span></button>
      </div>

      <div v-if="hasInputError" class="catalog-state" role="alert">
        <span class="state-mark" aria-hidden="true">!</span><h3>Let's try that search again.</h3>
        <p>The search link contains invalid parameters. Try a shorter search or return to the full collection.</p>
        <button type="button" class="state-button" @click="clearSearch">View the collection ↗</button>
      </div>
      <div v-else-if="status === 'pending'" class="catalog-state" role="status">
        <span class="state-mark" aria-hidden="true">✧</span><h3>Discovering the collection…</h3><p>Just a moment while we find your pieces.</p>
      </div>
      <div v-else-if="error" class="catalog-state" role="alert">
        <span class="state-mark" aria-hidden="true">!</span><h3>The collection couldn't be loaded.</h3>
        <p>This looks temporary. Please try again in a moment.</p>
        <button type="button" class="state-button" @click="refresh()">Try again ↻</button>
      </div>
      <div v-else-if="!data.items.length" class="catalog-state">
        <span class="state-mark" aria-hidden="true">✧</span>
        <h3>{{ page > 1 ? 'No pieces on this page' : search ? 'No matching pieces' : 'The collection is coming together' }}</h3>
        <p>{{ search ? 'Try a different name, style, or reference.' : 'Please check back soon to discover the collection.' }}</p>
        <button v-if="page > 1" type="button" class="state-button" @click="showPage(1)">Back to first page ↗</button>
        <button v-else-if="search" type="button" class="state-button" @click="clearSearch">Clear search ↗</button>
      </div>
      <div v-else class="product-grid">
        <NuxtLink v-for="(product, index) in data.items" :key="product.id" class="product-card" :to="`/products/${product.slug}`" :aria-label="`View ${product.name}`">
          <div class="product-card-art" :class="`art-tone-${index % 4}`">
            <span class="product-index" aria-hidden="true">{{ String((page - 1) * data.pageSize + index + 1).padStart(2, '0') }}</span>
            <svg class="product-illustration" viewBox="0 0 240 240" fill="none" aria-hidden="true">
              <ellipse cx="120" cy="195" rx="65" ry="10" fill="currentColor" opacity=".1"/>
              <ellipse cx="120" cy="113" rx="52" ry="71" stroke="currentColor" stroke-width="7" opacity=".72"/>
              <ellipse cx="120" cy="113" rx="42" ry="61" stroke="currentColor" stroke-width="1.5" opacity=".65"/>
              <path d="M120 157C105 178 96 184 96 200C96 214 107 224 120 224C133 224 144 214 144 200C144 184 135 178 120 157Z" fill="currentColor" opacity=".76"/>
              <path d="M116 181C108 192 107 202 114 210" stroke="#fff7e9" stroke-width="3" stroke-linecap="round" opacity=".7"/>
            </svg>
            <span class="placeholder-caption">Illustrative placeholder</span>
            <span v-if="!product.isAvailable" class="stock-tag">Currently unavailable</span>
            <span class="view-piece">Discover piece ↗</span>
          </div>
          <div class="product-card-body">
            <div>
              <span class="product-kicker">{{ product.slug.startsWith('demo-') ? 'DEMONSTRATION PIECE' : 'USHANGA.JEWELS' }}</span>
              <h3>{{ product.name }}</h3>
              <p class="product-price">{{ product.priceFromPence === null ? 'Currently unavailable' : `From ${formatPrice(product.priceFromPence)}` }}</p>
            </div>
            <span class="product-card-arrow" aria-hidden="true">↗</span>
          </div>
        </NuxtLink>
      </div>

      <nav v-if="totalPages > 1 && !error && !hasInputError" class="pagination" aria-label="Catalogue pages">
        <button type="button" :disabled="page <= 1 || status === 'pending'" @click="showPage(page - 1)">← Previous</button>
        <span>Page <strong>{{ page }}</strong> of {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages || status === 'pending'" @click="showPage(page + 1)">Next →</button>
      </nav>
    </section>

    <section id="story" class="story-band">
      <div class="story-inner atelier-container">
        <span class="story-number">02 / OUR APPROACH</span>
        <div class="story-content">
          <span class="story-asterisk" aria-hidden="true">✳</span>
          <h2>It's the details<br>that tell <em>the story.</em></h2>
          <p>Shape, colour, texture, and finish each have a character of their own. Discover the combination that feels like an expression of you.</p>
          <a href="#collection" class="story-link">Return to the collection ↗</a>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.atelier-page { --ink: #25352f; --bronze: #947349; color: var(--ink); background: #f8f6f0; overflow: hidden; }
.atelier-container { width: min(1200px, calc(100% - 80px)); margin-inline: auto; }
.eyebrow { font: 700 10px 'DM Sans', sans-serif; letter-spacing: .26em; color: #a68a62; }
.editorial-hero-inner { display: grid; grid-template-columns: 1fr .92fr; min-height: 690px; background: #edece3; }
.hero-intro { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; padding: 100px 45px 40px max(45px, calc((100vw - 1200px) / 2)); }
.hero-intro-top { display: flex; align-items: center; gap: 16px; }
.mini-rule { width: 34px; height: 1px; background: #aa987b; }
.hero-intro h1 { font: 400 clamp(70px, 7vw, 110px)/1.02 'Playfair Display', Georgia, serif; letter-spacing: -.06em; margin: 48px 0 28px; }
.hero-intro h1 em { font-weight: 400; color: #947751; }
.hero-description { max-width: 380px; font-size: 15px; line-height: 1.9; color: #6c786e; margin: 0; }
.hero-link { display: inline-flex; align-items: center; gap: 26px; border-bottom: 1px solid #7d8b77; padding-bottom: 8px; margin-top: 42px; font-size: 12px; font-weight: 700; transition: gap .2s; }
.hero-link:hover { gap: 37px; }
.circle-arrow { display: grid; place-items: center; width: 35px; height: 35px; border: 1px solid #91a092; border-radius: 50%; font-size: 19px; font-weight: 400; }
.hero-footnote { margin-top: auto; padding-top: 58px; width: 100%; display: flex; justify-content: space-between; gap: 18px; color: #999a8d; font-size: 9px; font-weight: 700; letter-spacing: .18em; }
.hero-stage { min-height: 690px; position: relative; overflow: hidden; display: grid; place-items: center; background: radial-gradient(ellipse at 42% 22%, #eaddc2, transparent 50%), linear-gradient(145deg, #d9c5a5, #a99173 62%, #857561); }
.hero-stage::before { content: ''; position: absolute; width: 66%; aspect-ratio: 1; border: 1px solid #fff7e75c; border-radius: 50%; top: 16%; left: 16%; }
.hero-watermark { position: absolute; top: 12px; right: 28px; color: #fff7e65c; font: italic 400 132px/1 'Playfair Display', Georgia, serif; }
.hero-jewel { width: min(94%, 620px); max-height: 650px; transform: rotate(5deg); filter: drop-shadow(5px 20px 16px #4e3a284a); }
.hero-stage-bottom { position: absolute; bottom: 34px; left: 38px; right: 38px; display: flex; justify-content: space-between; gap: 18px; font-size: 9px; font-weight: 700; letter-spacing: .19em; color: #fff7e4e8; }
.chapter-strip { min-height: 68px; padding: 14px 22px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 20px clamp(22px, 4vw, 75px); background: #30483d; color: #ede6d7; font-size: 10px; font-weight: 700; letter-spacing: .28em; }
.chapter-strip i { color: #cbab7a; font-style: normal; }
.collection-section { padding: 110px 0 120px; scroll-margin-top: 20px; }
.section-heading.collection-intro { display: flex; align-items: end; justify-content: space-between; gap: 30px; margin-bottom: 38px; }
.collection-intro h2 { font: 400 clamp(50px, 5.2vw, 75px)/1.1 'Playfair Display', Georgia, serif; letter-spacing: -.052em; margin: 16px 0 0; }
.collection-intro h2 em { color: #97744f; font-weight: 400; }
.collection-intro > p { max-width: 320px; font-size: 13px; color: #777b71; line-height: 1.85; margin: 0 0 8px; }
.catalog-search { max-width: 750px; display: flex; align-items: center; gap: 15px; padding: 7px 7px 7px 22px; border: 1px solid #dcd9cc; background: #fff; box-shadow: 0 10px 30px #2e3c3008; }
.catalog-search:focus-within { border-color: #759079; box-shadow: 0 0 0 3px #758f791c; }
.search-icon { flex: none; width: 21px; height: 21px; color: #8a866f; }
.catalog-search input { flex: 1; min-width: 0; border: none; outline: none; padding: 15px 0; background: transparent; color: #2a3c31; font-size: 13px; }
.catalog-search input::placeholder { color: #a5a69b; }
.search-submit { display: inline-flex; align-items: center; justify-content: center; gap: 26px; min-height: 48px; padding: 0 22px; border: 0; background: #314d3f; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
.search-submit:hover { background: #476a54; }
.search-submit span { font-size: 18px; font-weight: 400; }
.demo-notice { display: flex; align-items: flex-start; gap: 13px; max-width: 750px; margin-top: 17px; border: 1px solid #e5dfd0; background: #f3efe5; padding: 12px 16px; }
.demo-notice p { margin: 0; color: #887b67; font-size: 11px; line-height: 1.8; }
.demo-notice strong { color: #5f5543; }
.notice-pip { flex: none; width: 7px; height: 7px; margin-top: 6px; background: #b89a66; border-radius: 50%; }
.results-header { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 20px; font-size: 12px; color: #7b8073; }
.results-header strong { color: #243b2e; font-size: 14px; }
.reset-button { padding: 9px 0 9px 10px; border: 0; background: transparent; color: #47674f; font-size: 11px; font-weight: 700; }
.reset-button span { margin-left: 6px; font-size: 18px; }
.product-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; }
.product-card { display: block; min-width: 0; background: #fffdfa; border: 1px solid #e8e2d6; transition: transform .25s, box-shadow .25s; }
.product-card:hover { transform: translateY(-6px); box-shadow: 0 24px 44px #202f241a; }
.product-card:focus-visible { outline: 3px solid #947349; outline-offset: 4px; }
.product-card-art { aspect-ratio: 1/1.02; min-height: 270px; position: relative; display: grid; place-items: center; overflow: hidden; color: #a97e52; }
.art-tone-0 { background: radial-gradient(circle at 32% 24%, #fff7dd, transparent 48%), linear-gradient(145deg, #e6d9c4, #c2a98b); color: #ac7c47; }
.art-tone-1 { background: radial-gradient(circle at 42% 18%, #f0f5e6, transparent 55%), linear-gradient(145deg, #c9d2bf, #8c9d8d); color: #53725b; }
.art-tone-2 { background: radial-gradient(circle at 32% 21%, #ffebdf, transparent 48%), linear-gradient(145deg, #e6d1c9, #b99791); color: #ad756e; }
.art-tone-3 { background: radial-gradient(circle at 30% 15%, #f2eddf, transparent 50%), linear-gradient(145deg, #d6d3c8, #a4a398); color: #827f6a; }
.product-card-art::before { content: ''; position: absolute; width: 55%; aspect-ratio: 1; border: 1px solid #fff8e675; border-radius: 50%; transform: scale(1.25); }
.product-illustration { width: 64%; height: 75%; filter: drop-shadow(8px 16px 8px #4a3e3430); transition: transform .4s; }
.product-card:hover .product-illustration { transform: translateY(-7px) rotate(4deg) scale(1.06); }
.product-index { position: absolute; top: 18px; left: 18px; color: #333b36b0; font-size: 11px; letter-spacing: .14em; }
.placeholder-caption { position: absolute; bottom: 17px; left: 18px; color: #333e38b7; font-size: 9px; text-transform: uppercase; letter-spacing: .13em; }
.stock-tag { position: absolute; top: 13px; right: 13px; background: #fcf8f0ed; color: #75634d; font-size: 10px; padding: 9px 11px; }
.view-piece { position: absolute; bottom: 15px; right: 17px; color: #334b39; font-size: 10px; font-weight: 700; opacity: 0; transform: translateY(5px); transition: opacity .2s, transform .2s; }
.product-card:hover .view-piece, .product-card:focus-visible .view-piece { opacity: 1; transform: none; }
.product-card-body { display: flex; justify-content: space-between; align-items: start; gap: 14px; padding: 24px 22px 28px; }
.product-kicker { font-size: 9px; letter-spacing: .19em; font-weight: 700; color: #9b8260; }
.product-card h3 { font: 400 clamp(21px, 2vw, 27px)/1.23 'Playfair Display', Georgia, serif; letter-spacing: -.024em; margin: 10px 0 12px; color: #293c31; }
.product-price { margin: 0; color: #687568; font-size: 12px; }
.product-card-arrow { flex: none; color: #9b805c; font-size: 22px; margin-top: 5px; }
.catalog-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 85px 24px; border: 1px solid #e6dfd4; background: #fffdfa; }
.state-mark { font: 400 47px 'Playfair Display', Georgia, serif; color: #b49a76; }
.catalog-state h3 { margin: 16px 0 10px; color: #2c4236; font: 400 clamp(26px, 3vw, 36px) 'Playfair Display', Georgia, serif; }
.catalog-state p { max-width: 420px; color: #797c72; font-size: 13px; line-height: 1.8; margin: 0; }
.state-button { display: inline-block; margin-top: 27px; border: 1px solid #345040; background: #345040; padding: 14px 19px; color: #fff; font-size: 11px; font-weight: 700; }
.state-button:hover { background: #456b52; }
.pagination { display: flex; align-items: center; justify-content: center; gap: 40px; margin-top: 60px; }
.pagination button { padding: 12px 16px; border: 1px solid #c6c8b9; background: transparent; color: #395042; font-size: 12px; }
.pagination button:hover:not(:disabled) { background: #edeee5; border-color: #405a49; }
.pagination button:disabled { opacity: .42; cursor: not-allowed; }
.pagination span { font-size: 10px; letter-spacing: .14em; color: #7e8278; font-weight: 700; }
.pagination strong { color: #293f33; }
.story-band { background: #30483d; color: #f8f4e9; }
.story-inner { min-height: 530px; display: grid; grid-template-columns: 1fr 4fr; gap: 20px; padding-top: 76px; padding-bottom: 76px; }
.story-number { color: #bfcdb9; font-size: 10px; letter-spacing: .19em; }
.story-content { text-align: center; max-width: 720px; justify-self: center; }
.story-asterisk { color: #d9bd8d; font-size: 32px; }
.story-content h2 { margin: 20px 0; font: 400 clamp(44px, 5vw, 70px)/1.16 'Playfair Display', Georgia, serif; letter-spacing: -.05em; }
.story-content h2 em { color: #d7b88a; font-weight: 400; }
.story-content p { max-width: 480px; margin: 0 auto; color: #d1dacd; line-height: 2; font-size: 13px; }
.story-link { display: inline-block; margin-top: 34px; padding-bottom: 10px; border-bottom: 1px solid #9da997; font-size: 12px; }
.story-link:hover { color: #edd5b0; }
.atelier-page a:focus-visible, .atelier-page button:focus-visible { outline: 3px solid #a98751; outline-offset: 4px; }
@media (max-width: 1050px) {
  .hero-intro { padding-left: 47px; padding-right: 30px; }
  .editorial-hero-inner, .hero-stage { min-height: 590px; }
  .hero-intro h1 { font-size: clamp(65px, 8vw, 85px); }
  .product-grid { gap: 19px; }
}
@media (max-width: 850px) {
  .atelier-container { width: calc(100% - 52px); }
  .editorial-hero-inner { grid-template-columns: 1fr; }
  .hero-intro { min-height: 510px; padding: 65px 45px 35px; }
  .hero-intro h1 { font-size: clamp(66px, 10vw, 95px); margin-top: 34px; }
  .hero-stage { min-height: 440px; max-height: 560px; }
  .hero-jewel { width: min(90%, 450px); }
  .collection-section { padding: 86px 0; }
  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .story-inner { grid-template-columns: 1fr; min-height: auto; }
}
@media (max-width: 600px) {
  .atelier-container { width: calc(100% - 36px); }
  .hero-intro { min-height: 465px; padding: 50px 24px 28px; }
  .hero-intro h1 { font-size: clamp(60px, 14vw, 76px); margin: 32px 0 22px; }
  .hero-description { font-size: 13px; }
  .hero-link { margin-top: 28px; }
  .hero-footnote { font-size: 8px; padding-top: 45px; }
  .hero-footnote span:last-child { max-width: 160px; text-align: right; }
  .hero-stage { min-height: 345px; }
  .hero-jewel { width: 350px; }
  .hero-watermark { font-size: 100px; }
  .hero-stage-bottom { left: 19px; right: 19px; bottom: 22px; font-size: 7px; }
  .chapter-strip { gap: 12px 19px; font-size: 8px; min-height: 54px; letter-spacing: .18em; }
  .collection-section { padding: 66px 0 76px; }
  .section-heading.collection-intro { display: block; margin-bottom: 28px; }
  .collection-intro h2 { font-size: 54px; }
  .collection-intro > p { margin-top: 16px; }
  .catalog-search { gap: 8px; padding: 6px 6px 6px 12px; }
  .search-icon { width: 17px; height: 17px; }
  .catalog-search input { font-size: 12px; }
  .search-submit { min-height: 44px; padding: 0 12px; gap: 8px; font-size: 9px; }
  .demo-notice { padding: 11px; }
  .product-grid { grid-template-columns: 1fr; gap: 20px; }
  .product-card-art { aspect-ratio: 1.18 / 1; min-height: 260px; }
  .view-piece { opacity: 1; transform: none; }
  .product-card-body { padding: 20px; }
  .pagination { gap: 12px; justify-content: space-between; }
  .pagination button { padding: 12px 9px; font-size: 11px; }
  .pagination span { font-size: 9px; letter-spacing: .06em; }
  .story-inner { padding-top: 55px; padding-bottom: 65px; }
  .story-content h2 { font-size: 47px; }
}
@media (prefers-reduced-motion: reduce) {
  .hero-link, .product-card, .product-illustration, .view-piece { transition: none; }
}
</style>
