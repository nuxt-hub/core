<template>
  <Alert
    title="Tip"
    icon="i-ph-lightbulb-duotone"
    color="green"
    class="prose-a:text-green-500 hover:prose-a:border-green-500 dark:prose-a:text-green-400 dark:hover:prose-a:border-green-400 dark:!bg-green-800/40 !bg-green-200/40 dark:!border-green-600/30 !border-green-400/30"
    :class="$attrs.to ? 'dark:hover:!border-green-600/50 hover:!border-green-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
