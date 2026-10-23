<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="site-header">
      <div class="site-header-inner container">
        <NuxtLink to="/" class="wordmark" aria-label="Ushanga Jewels home">
          <span class="wordmark-symbol" aria-hidden="true">✧</span>
          <span>USHANGA<span class="wordmark-dot">.</span>JEWELS</span>
        </NuxtLink>
        <nav class="site-nav" aria-label="Main navigation">
          <NuxtLink to="/#collection">Collection</NuxtLink>
          <NuxtLink to="/#story">Our approach</NuxtLink>
        </nav>
      </div>
    </header>
    <NuxtPage />
    <footer class="site-footer">
      <div class="container footer-inner">
        <span class="wordmark footer-wordmark">USHANGA.JEWELS</span>
        <p>Considered pieces. Your own story.</p>
        <span>© {{ new Date().getFullYear() }} Ushanga.Jewels</span>
      </div>
    </footer>
  </div>
</template>
