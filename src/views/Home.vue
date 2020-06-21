<template>
  <div class="Home"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ipcRenderer } from 'electron';

@Component({
  beforeRouteEnter: (to, from, next) => {
    if (Vue.UserStore.sessionState.login) return next();
    next({ name: 'Login', replace: true });
  },
})
export default class Home extends Vue {
  mounted() {
    ipcRenderer.send('size', 500, 600, true);
  }
}
</script>

<style scoped lang="scss">
.Home {
  background-color: rgba($color-main, 0.5);
}
</style>
