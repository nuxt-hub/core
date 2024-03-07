<template>
  <Alert
    title="Tip"
    icon="i-ph-lightbulb-duotone"
    color="green"
    class="_tip"
    :class="$attrs.to ? 'dark:hover:!border-green-600/50 hover:!border-green-400/50' : ''"
  >
    <ContentSlot :use="$slots.default" unwrap="p" />
  </Alert>
</template>

<style lang="postcss">
._tip {
  @apply prose-a:text-green-500 hover:prose-a:border-green-500 !bg-green-200/40 !border-green-400/30 prose-code:text-green-700 text-green-900;
  @apply dark:!border-green-600 dark:prose-a:text-green-400 dark:hover:prose-a:border-green-400 dark:!bg-green-900/70 dark:text-green-200 dark:prose-code:text-green-200;
  a code {
    @apply hover:!text-green-600 hover:!border-green-400;
    @apply dark:hover:!text-green-400 dark:hover:!border-green-400;
  }
}
</style>
