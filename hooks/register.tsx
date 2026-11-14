import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { GROWTH } from './scene-growth.js'
import { WIDE } from './scene-wide.js'

// Брендбук Inweb 2026: зелений #003B29, помаранчевий #EF583D, лайм #F0FC7E.
// Основа чорна, лайм акцентом, на фоні повільне зелене й лаймове світіння.
const { theme, problems } = makeColors({
  label: 'Inweb 2026',
  only: 'dark',
  roles: { accent: '#F0FC7E', danger: '#EF583D', success: '#3FAE78', warning: '#E8A93A', pro: '#9A7BD0' },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#0B0D0C',
        'surface-1': '#121513',
        'surface-2': '#181B19',
        'surface-3': '#1E221F',
        'text-primary': '#F2F4EE',
        'text-secondary': '#C9CEC6',
        'text-muted': '#9AA196',
      },
    },
  },
})

const CALM = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
<defs>
  <radialGradient id="g" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#316B53" stop-opacity="0.55"/>
    <stop offset="0.5" stop-color="#003B29" stop-opacity="0.35"/>
    <stop offset="1" stop-color="#003B29" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="l" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#F0FC7E" stop-opacity="0.16"/>
    <stop offset="1" stop-color="#F0FC7E" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="o" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="#EF583D" stop-opacity="0.08"/>
    <stop offset="1" stop-color="#EF583D" stop-opacity="0"/>
  </radialGradient>
</defs>
<style>
  .a{animation:da 38s ease-in-out infinite alternate;transform-origin:center;transform-box:fill-box}
  .b{animation:db 46s ease-in-out infinite alternate;transform-origin:center;transform-box:fill-box}
  .c{animation:dc 54s ease-in-out infinite alternate;transform-origin:center;transform-box:fill-box}
  @keyframes da{from{transform:translate(0,0) scale(1)}to{transform:translate(140px,90px) scale(1.15)}}
  @keyframes db{from{transform:translate(0,0) scale(1.05)}to{transform:translate(-160px,-70px) scale(0.92)}}
  @keyframes dc{from{transform:translate(0,0)}to{transform:translate(-90px,120px)}}
  @media (prefers-reduced-motion: reduce){.a,.b,.c{animation:none}}
</style>
<rect width="1600" height="1000" fill="#0B0D0C"/>
<ellipse class="a" cx="180" cy="120" rx="700" ry="520" fill="url(#g)"/>
<ellipse class="b" cx="1450" cy="900" rx="620" ry="460" fill="url(#l)"/>
<ellipse class="c" cx="1500" cy="80" rx="420" ry="320" fill="url(#o)"/>
</svg>`

const GLASS = { blur: 2, tint: '#0B0D0C', opacity: 0.15 }
// Дві сцени: «Зростання» за замовчуванням і спокійні відблиски (версія 0.2) на /inweb-theme calm.
const LOOKS: { growth: ThemeSetArgs; wide: ThemeSetArgs; calm: ThemeSetArgs } = {
  growth: { colors: theme, backdrop: { scene: 'inweb-growth-4', glass: GLASS } },
  wide: { colors: theme, backdrop: { scene: 'inweb-wide-1', glass: GLASS } },
  calm: { colors: theme, backdrop: { scene: 'inweb-glow-2', glass: GLASS } },
}
const SCENES: Record<string, { svg: string; alt: string }> = {
  'inweb-growth-4': { svg: GROWTH, alt: 'Графік зростання, мережа з імпульсами і стовпчики в кольорах Inweb' },
  'inweb-wide-1': { svg: WIDE, alt: 'Графік зростання, мережа з імпульсами і стовпчики по краях вікна, в кольорах Inweb' },
  'inweb-glow-2': { svg: CALM, alt: 'Повільне зелене й лаймове світіння на чорному' },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'inweb-theme',
      description: 'Тема Inweb: без аргументу «Зростання» по центру, wide по краях вікна, calm спокійні відблиски, off вимикає',
    })
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))
    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOKS.growth)
    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('command.run', { command: 'inweb-theme' }, async ($, e) => {
    if (String(e.args ?? '').trim() === 'off') {
      await $.theme.clear()

      return { text: 'Тему Inweb вимкнено.' }
    }
    const arg = String(e.args ?? '').trim()
    const set = await $.theme.set(arg === 'calm' ? LOOKS.calm : arg === 'wide' ? LOOKS.wide : LOOKS.growth)

    return { text: set.isDrawn ? 'Тему Inweb увімкнено.' : `Тему збережено, але зараз не малюється: ${set.reason}` }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    const scene = SCENES[e.props.scene]
    if (scene === undefined || (e.surface !== 'desktop' && e.surface !== 'mobile')) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return <Svg source={scene.svg} alt={scene.alt} isInteractive />
  })
}
