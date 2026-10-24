<script setup lang="ts">
type CatalogueVariant = {
  id: string
  sku: string
  label: string
  pricePence: number
  inventoryMode: 'tracked' | 'made_to_order'
  stockOnHand: number | null
  isAvailable: boolean
}

type CatalogueProduct = {
  id: string
  slug: string
  name: string
  description: string | null
  currency: 'GBP'
  variants: CatalogueVariant[]
}

const route = useRoute()

// Refetch when Nuxt reuses this page for a new product slug.
const { data: product, status, error, refresh } = await useFetch<CatalogueProduct>(
  () => '/api/products/' + encodeURIComponent(String(route.params.slug)),
)

const notFound = computed(() => error.value?.statusCode === 404)

if (import.meta.server && error.value) {
  setResponseStatus(notFound.value ? 404 : 503)
}

const chosenId = ref<string | null>(null)

// Start with an orderable option, if one exists. Sold-out options can
// still be selected to inspect their exact price, reference and status.
const chosenVariant = computed(() => {
  const variants = product.value?.variants ?? []
  return variants.find(variant => variant.id === chosenId.value)
    ?? variants.find(variant => variant.isAvailable)
    ?? variants[0]
})

watch(() => product.value?.id, () => { chosenId.value = null })

const formatPrice = (pence: number) => new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
}).format(pence / 100)

useSeoMeta({
  title: () => product.value
    ? product.value.name + ' | Ushanga.Jewels'
    : 'Collection | Ushanga.Jewels',
  description: () => product.value?.description || 'Explore the Ushanga.Jewels collection.',
})
</script>

<template>
  <main class="detail-section piece-page">
    <div class="piece-shell">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <NuxtLink to="/">Home</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/#collection">The collection</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="breadcrumb-current" aria-current="page">{{ product?.name ?? 'Piece' }}</span>
      </nav>

      <div v-if="status === 'pending'" class="catalog-state state-card" role="status">
        <span class="state-monogram" aria-hidden="true">U.</span>
        <span class="eyebrow">THE COLLECTION</span>
        <h1>Loading piece…</h1>
        <p>Just a moment while we find its details.</p>
      </div>

      <div v-else-if="error || !product" class="catalog-state state-card" role="alert">
        <span class="state-monogram" aria-hidden="true">U.</span>
        <span class="eyebrow">THE COLLECTION</span>
        <h1>{{ notFound ? 'Piece not found' : 'The piece could not be loaded' }}</h1>
        <p>{{ notFound ? 'It may no longer be part of the collection.' : 'The catalogue is temporarily unavailable. Please try again.' }}</p>
        <button v-if="!notFound" type="button" class="retry-button" @click="refresh()">Try again ↻</button>
        <NuxtLink to="/#collection" class="detail-back">← Back to the collection</NuxtLink>
      </div>

      <section v-else class="detail-layout" aria-labelledby="piece-title">
        <div class="detail-gallery">
          <div class="detail-art" role="img" aria-label="Illustrative jewellery concept, not a photograph of this product">
            <div class="art-halo" aria-hidden="true" />
            <div class="art-edition" aria-hidden="true">THE USHANGA EDIT</div>
            <svg class="jewel-study" viewBox="0 0 560 620" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="piece-gold" x1="114" y1="87" x2="471" y2="488" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#f8e7bc" />
                  <stop offset=".27" stop-color="#9d6a32" />
                  <stop offset=".52" stop-color="#f7dca4" />
                  <stop offset=".78" stop-color="#a5723a" />
                  <stop offset="1" stop-color="#f6dfb4" />
                </linearGradient>
                <radialGradient id="piece-stone" cx="0" cy="0" r="1" gradientTransform="translate(270 329) rotate(49) scale(130 181)" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#dce8d5" />
                  <stop offset=".4" stop-color="#7b9b81" />
                  <stop offset="1" stop-color="#345c53" />
                </radialGradient>
                <filter id="piece-shadow" x="-70%" y="-70%" width="250%" height="260%">
                  <feDropShadow dx="15" dy="23" stdDeviation="14" flood-color="#58442b" flood-opacity=".3" />
                </filter>
              </defs>
              <ellipse cx="285" cy="537" rx="164" ry="19" fill="#4b3a2c" opacity=".13" />
              <path d="M108 76C117 225 193 313 279 325C370 337 452 234 459 78" stroke="#584430" stroke-width="16" stroke-linecap="round" opacity=".12" />
              <path d="M107 71C116 219 194 304 279 316C369 326 451 227 457 71" stroke="url(#piece-gold)" stroke-width="9" stroke-linecap="round" />
              <path d="M116 79C128 216 202 296 279 307C364 317 441 225 448 79" stroke="#fff1c8" stroke-width="2" stroke-linecap="round" opacity=".8" />
              <g filter="url(#piece-shadow)" transform="rotate(-8 283 408)">
                <path d="M283 326C258 351 215 390 218 436C220 478 250 510 283 516C320 512 352 478 354 435C356 390 306 350 290 326C288 322 285 322 283 326Z" fill="url(#piece-stone)" stroke="url(#piece-gold)" stroke-width="13" />
                <path d="M281 349C252 382 239 411 241 439C242 465 257 485 274 496" stroke="#eaf5e5" stroke-width="5" opacity=".63" stroke-linecap="round" />
                <path d="M307 361C333 399 336 442 318 474" stroke="#214e48" stroke-width="5" opacity=".32" stroke-linecap="round" />
                <circle cx="286" cy="327" r="14" fill="url(#piece-gold)" stroke="#efd8a6" stroke-width="4" />
              </g>
            </svg>
            <div class="art-footer"><span>FORM STUDY / 001</span><span>ILLUSTRATIVE CONCEPT</span></div>
          </div>
          <div class="gallery-caption">
            <span class="gallery-diamond" aria-hidden="true">✧</span>
            <p>Artwork shown is an illustrative placeholder. Product photography will be added when available.</p>
          </div>
        </div>

        <div class="detail-content">
          <div class="piece-heading">
            <span class="eyebrow">USHANGA.JEWELS &nbsp; / &nbsp; THE COLLECTION</span>
            <p v-if="product.slug.startsWith('demo-')" class="demo-notice">
              <span class="demo-dot" aria-hidden="true" />
              Demonstration product · sample details and price.
            </p>
            <h1 id="piece-title">{{ product.name }}</h1>
            <div class="heading-rule" aria-hidden="true"><span>✦</span></div>
            <p class="detail-description">{{ product.description || 'Product description is not yet available.' }}</p>
          </div>

          <div class="variant-section">
            <div class="variant-heading">
              <span class="variant-label">SELECT YOUR OPTION</span>
              <span class="variant-count">{{ String(product.variants.length).padStart(2, '0') }} {{ product.variants.length === 1 ? 'OPTION' : 'OPTIONS' }}</span>
            </div>
            <div class="variant-list" role="group" aria-label="Product options">
              <button
                v-for="variant in product.variants"
                :key="variant.id"
                type="button"
                class="variant-option"
                :aria-pressed="chosenVariant?.id === variant.id"
                :data-unavailable="!variant.isAvailable"
                @click="chosenId = variant.id"
              >{{ variant.label }}</button>
            </div>
            <p class="variant-hint">Select an option to view its price, availability, and reference.</p>
          </div>

          <div v-if="chosenVariant" class="price-section">
            <div>
              <span class="price-eyebrow">PRICE / GBP</span>
              <p class="detail-price" aria-live="polite">{{ formatPrice(chosenVariant.pricePence) }}</p>
            </div>
            <div class="availability-block">
              <span class="availability-light" :class="{ 'is-unavailable': !chosenVariant.isAvailable }" aria-hidden="true" />
              <p class="detail-availability" aria-live="polite">
                {{ chosenVariant.inventoryMode === 'made_to_order'
                  ? 'Made to order'
                  : chosenVariant.isAvailable
                    ? 'Available · ' + chosenVariant.stockOnHand + ' in stock'
                    : 'Currently out of stock' }}
              </p>
            </div>
          </div>

          <div v-if="chosenVariant" class="reference-section">
            <p class="detail-reference">Reference: {{ chosenVariant.sku }}</p>
            <p class="catalogue-disclaimer">Catalogue preview only. Online ordering is not enabled on this page.</p>
          </div>
          <NuxtLink to="/#collection" class="detail-back"><span aria-hidden="true">←</span> Continue exploring</NuxtLink>
        </div>
      </section>
    </div>
    <div class="end-strip" aria-hidden="true"><span>FORM</span><i>✦</i><span>COLOUR</span><i>✦</i><span>EXPRESSION</span><i>✦</i><span>DETAIL</span></div>
  </main>
</template>

<style scoped>
.piece-page { --piece-ink: #293e33; --piece-gold: #947349; padding: 0; background: #f8f6f0; color: var(--piece-ink); overflow: clip; }
.piece-shell { width: min(1220px, calc(100% - 80px)); margin-inline: auto; padding: 31px 0 108px; }
.piece-page .breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 13px; margin: 0 0 43px; color: #8e9285; font-size: 11px; }
.piece-page .breadcrumb a { color: #56705b; text-decoration: none; border-bottom: 1px solid transparent; }
.piece-page .breadcrumb a:hover { border-bottom-color: #56705b; }
.breadcrumb-current { color: #596858; overflow-wrap: anywhere; }
.piece-page .detail-layout { display: grid; grid-template-columns: minmax(0, 1.03fr) minmax(0, .97fr); gap: clamp(43px, 7vw, 100px); align-items: start; }
.detail-gallery { min-width: 0; }
.piece-page .detail-art { position: relative; min-height: 625px; display: grid; place-items: center; overflow: hidden; background: radial-gradient(ellipse at 38% 20%, #f1e3c7, transparent 52%), linear-gradient(148deg, #ddd0b9, #b5a083 62%, #998870); }
.art-halo { position: absolute; width: 74%; aspect-ratio: 1; top: 13%; left: 13%; border: 1px solid #fff9e76b; border-radius: 50%; }
.art-halo::after { content: ''; position: absolute; inset: 11%; border: 1px solid #fff9e73b; border-radius: 50%; }
.art-edition { position: absolute; top: 30px; left: 31px; z-index: 1; color: #fff9eb; font-size: 9px; font-weight: 700; letter-spacing: .24em; }
.jewel-study { width: min(94%, 570px); max-height: 620px; position: relative; filter: drop-shadow(10px 20px 13px #4a38282b); transform: rotate(4deg); }
.art-footer { position: absolute; bottom: 28px; left: 30px; right: 30px; display: flex; justify-content: space-between; gap: 10px; color: #fffaed; font-size: 9px; font-weight: 700; letter-spacing: .16em; }
.piece-page .detail-art .art-footer span { color: inherit; font-size: inherit; text-shadow: none; }
.gallery-caption { display: flex; align-items: flex-start; gap: 12px; padding: 18px 0 0; color: #88897e; }
.gallery-diamond { font: 400 24px Georgia, serif; color: #a28e6c; line-height: 1; }
.gallery-caption p { max-width: 350px; font-size: 11px; line-height: 1.75; margin: 0; }
.piece-page .detail-content { padding: 29px 0 0; min-width: 0; }
.eyebrow { display: block; color: #a18a65; font-size: 10px; font-weight: 700; letter-spacing: .22em; }
.demo-notice { display: inline-flex; align-items: center; gap: 9px; padding: 11px 13px; background: #eee9de; color: #806e52; border: 1px solid #e2d9c8; font-size: 10px; line-height: 1.55; margin: 22px 0 0; }
.demo-dot { width: 6px; height: 6px; background: #a68b5e; border-radius: 50%; flex: none; }
.piece-page .detail-content h1 { font: 400 clamp(47px, 4.8vw, 74px)/1.1 'Playfair Display', Georgia, serif; letter-spacing: -.052em; margin: 28px 0 21px; overflow-wrap: anywhere; }
.heading-rule { position: relative; height: 23px; max-width: 180px; color: #b1956b; font-size: 17px; }
.heading-rule::before { content: ''; position: absolute; left: 0; top: 11px; width: 88px; height: 1px; background: #d9cdb7; }
.heading-rule span { position: absolute; left: 99px; top: 0; }
.piece-page .detail-description { margin: 18px 0 0; max-width: 480px; color: #767f73; font-size: 14px; line-height: 1.9; white-space: pre-line; }
.variant-section { margin-top: 51px; }
.variant-heading { display: flex; align-items: center; justify-content: space-between; gap: 15px; padding-bottom: 13px; border-bottom: 1px solid #deddd1; }
.piece-page .variant-label { display: inline; margin: 0; font-size: 10px; letter-spacing: .19em; font-weight: 700; color: #3f5546; }
.variant-count { color: #91988a; font-size: 9px; letter-spacing: .13em; font-weight: 700; }
.piece-page .variant-list { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 19px; }
.piece-page .variant-option { position: relative; background: #fffefa; border: 1px solid #d6d7c9; padding: 14px 19px; min-height: 48px; color: #42584a; font-size: 12px; text-align: left; transition: border-color .15s, background-color .15s, color .15s; }
.piece-page .variant-option:hover { border-color: #67816d; }
.piece-page .variant-option[aria-pressed="true"] { background: #304c3c; color: #fff9ec; border-color: #304c3c; box-shadow: none; }
.piece-page .variant-option[data-unavailable="true"]:not([aria-pressed="true"]) { color: #a0a399; border-style: dashed; }
.piece-page .variant-option[data-unavailable="true"]::after { content: ''; display: inline-block; width: 5px; height: 5px; border-radius: 50%; background: #b38b7c; margin-left: 12px; vertical-align: middle; }
.variant-hint { margin: 13px 0 0; color: #98998d; font-size: 11px; line-height: 1.7; }
.price-section { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-top: 37px; padding: 24px 0; border-top: 1px solid #deddd1; border-bottom: 1px solid #deddd1; }
.price-eyebrow { font-size: 9px; letter-spacing: .2em; font-weight: 700; color: #a28c70; }
.piece-page .detail-price { font: 400 clamp(32px, 3.5vw, 46px)/1.1 'Playfair Display', Georgia, serif; color: #2c4738; margin: 11px 0 0; }
.availability-block { display: flex; align-items: center; gap: 8px; padding-bottom: 6px; text-align: right; }
.availability-light { width: 7px; height: 7px; background: #71957a; border-radius: 50%; flex: none; }
.availability-light.is-unavailable { background: #b68d75; }
.piece-page .detail-availability { color: #617769; font-size: 11px; line-height: 1.5; margin: 0; }
.reference-section { padding: 23px 0 0; }
.piece-page .detail-reference { border: none; padding: 0; margin: 0; color: #626c62; font-size: 11px; font-weight: 700; letter-spacing: .025em; overflow-wrap: anywhere; }
.catalogue-disclaimer { max-width: 340px; margin: 15px 0 0; color: #9b9e91; font-size: 11px; line-height: 1.8; }
.piece-page .detail-back { display: inline-flex; gap: 14px; align-items: center; padding-bottom: 9px; margin-top: 35px; border-bottom: 1px solid #819583; color: #355642; text-decoration: none; font-size: 12px; font-weight: 700; }
.detail-back span { font-size: 21px; line-height: 1; font-weight: 400; transition: transform .2s; }
.detail-back:hover span { transform: translateX(-4px); }
.end-strip { min-height: 67px; padding: 16px 22px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 20px clamp(20px, 4vw, 80px); background: #30483d; color: #ede6d7; font-size: 10px; font-weight: 700; letter-spacing: .28em; }
.end-strip i { color: #cbab7a; font-style: normal; }
.piece-page .state-card { display: flex; flex-direction: column; align-items: center; max-width: 780px; min-height: 460px; margin: 30px auto 90px; padding: 67px 30px; border: 1px solid #e6dfd4; background: #fffcf6; text-align: center; }
.state-monogram { color: #a78b67; font: italic 400 60px 'Playfair Display', Georgia, serif; }
.state-card h1 { font: 400 clamp(32px, 5vw, 48px)/1.2 'Playfair Display', Georgia, serif; margin: 22px 0 12px; }
.state-card p { max-width: 430px; color: #788176; font-size: 13px; line-height: 1.9; margin: 0; }
.retry-button { margin-top: 28px; border: 0; padding: 13px 24px; background: #304c3c; color: #fff; font-size: 12px; font-weight: 700; }
.retry-button:hover { background: #486b55; }
.piece-page button:focus-visible, .piece-page a:focus-visible { outline: 3px solid #b5915d; outline-offset: 4px; }
@media (max-width: 960px) {
  .piece-shell { width: calc(100% - 54px); }
  .piece-page .detail-layout { gap: 35px; }
  .piece-page .detail-art { min-height: 520px; }
  .piece-page .detail-content { padding-top: 8px; }
  .piece-page .detail-content h1 { font-size: clamp(43px, 5vw, 59px); }
}
@media (max-width: 700px) {
  .piece-shell { width: calc(100% - 36px); padding-top: 19px; padding-bottom: 68px; }
  .piece-page .breadcrumb { margin-bottom: 25px; gap: 9px; font-size: 10px; }
  .piece-page .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .piece-page .detail-art { min-height: 410px; }
  .jewel-study { width: min(90%, 430px); }
  .gallery-caption { padding-top: 13px; }
  .piece-page .detail-content { padding-top: 44px; }
  .piece-page .detail-content h1 { font-size: clamp(46px, 9vw, 65px); margin-top: 24px; }
  .variant-section { margin-top: 36px; }
  .end-strip { min-height: 55px; gap: 13px 20px; font-size: 8px; letter-spacing: .18em; }
}
@media (max-width: 370px) {
  .piece-page .detail-art { min-height: 340px; }
  .art-edition, .art-footer { font-size: 7px; }
  .art-footer { left: 15px; right: 15px; bottom: 15px; }
  .art-edition { left: 15px; top: 15px; }
  .piece-page .detail-content h1 { font-size: 43px; }
  .piece-page .variant-option { padding: 11px 13px; min-height: 43px; }
  .price-section { align-items: start; flex-direction: column; }
  .availability-block { padding-bottom: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .piece-page .variant-option, .detail-back span { transition: none; }
}
</style>
