<script setup>
import { tsParticles } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

const props = defineProps({
  size: {
    type: Number,
    default: 1
  },
  minSize: {
    type: Number,
    default: 0.4
  },
  density: {
    type: Number,
    default: 800
  },
  speed: {
    type: Number,
    default: 1
  },
  minSpeed: {
    type: Number,
    required: false
  },
  opacity: {
    type: Number,
    default: 1
  },
  opacitySpeed: {
    type: Number,
    default: 3
  },
  color: {
    type: String,
    default: '#00DC82'
  },
  background: {
    type: String,
    default: 'transparent'
  },
  options: {
    type: Object,
    required: false
  }
})

const defaultOptions = {
  background: {
    color: {
      value: props.background
    }
  },
  fullScreen: {
    enable: false,
    zIndex: 1
  },
  fpsLimit: 120,
  particles: {
    color: {
      value: props.color
    },
    move: {
      enable: true,
      direction: 'none',
      speed: {
        min: props.minSpeed || props.speed / 10,
        max: props.speed
      },
      straight: false
    },
    number: {
      value: props.density
    },
    opacity: {
      value: {
        min: props.minOpacity || props.opacity / 10,
        max: props.opacity
      },
      animation: {
        enable: true,
        sync: false,
        speed: props.opacitySpeed
      }
    },
    size: {
      value: {
        min: props.minSize || props.size / 2.5,
        max: props.size
      }
    }
  },
  detectRetina: true
}

let container

const id = useId()
onMounted(async () => {
  await loadSlim(tsParticles)

  container = await tsParticles.load({
    id,
    options: props.options || defaultOptions
  })
})

onUnmounted(() => {
  if (!container) {
    return
  }

  container.destroy()
})
</script>

<template>
  <div :id="id" />
</template>
