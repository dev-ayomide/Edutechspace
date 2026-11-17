// Chapter title cards for the walkthrough videos, in the site's own type (Newsreader + DM Sans, loaded by the app).
// We open a light page of the app so its fonts are registered, then replace the page with the card.
export async function showCard(page, base, { eyebrow = 'RUNTech Space', title, subtitle = '', dark = false }) {
  await page.goto(`${base}/verify`)
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([
      document.fonts.load('400 64px "Newsreader Variable"'),
      document.fonts.load('500 24px "DM Sans Variable"'),
    ])
  })
  await page.evaluate(
    ({ eyebrow, title, subtitle, dark }) => {
      const bg = dark ? '#0b1a4a' : '#f3f6fc'
      const ink = dark ? '#ffffff' : '#0b1230'
      const sub = dark ? '#b9c4e4' : '#4f5878'
      document.documentElement.className = ''
      document.body.innerHTML = `
        <div style="position:fixed;inset:0;display:grid;place-items:center;background:${bg};overflow:hidden">
          <div style="position:absolute;width:520px;height:340px;left:-80px;top:-60px;background:${dark ? '#08f1ff' : '#c6f4f8'};opacity:${dark ? 0.12 : 0.9};rotate:-8deg;border-radius:18px"></div>
          <div style="position:absolute;width:460px;height:300px;right:-90px;bottom:-70px;background:${dark ? '#c9d4f8' : '#c9d4f8'};opacity:${dark ? 0.14 : 0.9};rotate:7deg;border-radius:18px"></div>
          <div style="position:relative;max-width:980px;padding:0 64px;text-align:center">
            <p style="margin:0 0 18px;font:600 18px/1 'DM Sans Variable',system-ui;letter-spacing:.1em;text-transform:uppercase;color:${dark ? '#08f1ff' : '#1e3a8a'}">${eyebrow}</p>
            <h1 style="margin:0;font:400 74px/1.02 'Newsreader Variable',Georgia,serif;letter-spacing:-0.035em;color:${ink}">${title}</h1>
            <p style="margin:24px auto 0;max-width:40ch;font:400 24px/1.45 'DM Sans Variable',system-ui;color:${sub}">${subtitle}</p>
          </div>
        </div>`
    },
    { eyebrow, title, subtitle, dark },
  )
}
