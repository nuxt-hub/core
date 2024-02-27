<template>
  <Alert
    title="Important"
    icon="i-ph-warning-diamond-duotone"
    color="violet"
    class="prose-a:text-violet-500 hover:prose-a:border-violet-500 dark:prose-a:text-violet-400 dark:hover:prose-a:border-violet-400 dark:!bg-violet-800/30 !bg-violet-200/50 dark:!border-violet-600/30 !border-violet-400/30"
    :class="$attrs.to ? 'dark:hover:!border-violet-600/50 hover:!border-violet-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>
