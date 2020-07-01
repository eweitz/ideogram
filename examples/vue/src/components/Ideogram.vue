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
        container: '#ideo-container',
        dataDir: 'https://cdn.jsdelivr.net/npm/ideogram@1.20.0/dist/data/bands/native/'
      })
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  #ideo-container {
    height: 300px;
    width: 50%;
    margin: auto;
  }
</style>
