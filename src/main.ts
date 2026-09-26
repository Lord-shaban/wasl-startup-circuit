import './style.css'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('Application root is missing')
}

root.innerHTML = `
  <main class="shell">
    <section class="intro" aria-labelledby="game-title">
      <p class="eyebrow">WASL / STARTUP CIRCUIT</p>
      <h1 id="game-title">Build a company that comes alive.</h1>
      <p class="description">
        Turn one customer opportunity into a connected network of teams,
        deliveries, and referrals.
      </p>
      <p class="status"><span class="status-dot" aria-hidden="true"></span>Foundation build · Gameplay is in development</p>
    </section>
  </main>
`
