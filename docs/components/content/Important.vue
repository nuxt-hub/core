<template>
  <Alert
    title="Important"
    icon="i-ph-warning-diamond-duotone"
    color="violet"
    class="_important"
    :class="$attrs.to ? 'dark:hover:!border-violet-600/50 hover:!border-violet-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>

<style lang="postcss">
._important {
  @apply prose-a:text-violet-500 hover:prose-a:border-violet-500 !bg-violet-200/40 !border-violet-400/30 prose-code:text-violet-700 text-violet-950;
  @apply dark:!border-violet-600 dark:prose-a:text-violet-400 dark:hover:prose-a:border-violet-400 dark:!bg-violet-900/50 dark:text-violet-200 dark:prose-code:text-violet-200;
  a code {
    @apply hover:!text-violet-700 hover:!border-violet-400;
    @apply dark:hover:!text-violet-400 dark:hover:!border-violet-400;
  }
}
</style>
