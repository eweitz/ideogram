<template>
  <div id="ideo-container"></div>
</template>

<script>
  import Ideogram from 'ideogram'

  export default {
    name: 'Ideogram',
    mounted: function () {
      return new Ideogram({
        organism: 'human',
        container: '#ideo-container'
      })
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #ideo-container {
    height: 400px;
  }
</style>
