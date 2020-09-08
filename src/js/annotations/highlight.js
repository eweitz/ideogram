function highlight(chrNames, color='red') {
  const ideo = this;

  const ideoDom = document.querySelector(ideo.selector);
  const taxid = ideo.config.taxid;

  const highlightsHtml = chrNames.map(chrName => {
    const chrId = ideo.chromosomes[taxid][chrName].id;
    const chrSet = `${ideo.selector} #${chrId}-chromosome-set`;
    const chrDom = document.querySelector(chrSet);
    const rect = chrDom.getBoundingClientRect();

    const style = `style="
      stroke-width: 1px;
      stroke: ${color};
      fill: ${color};
      fill-opacity: 0.05;
      position: absolute;
      rx: 4;
      ry: 4;
      height: ${rect.width + 15}px;
      width: ${rect.height + 15}px"`;

    const left = chrDom.transform.baseVal[1].matrix.f - 7.5;
    const transform = `transform="rotate(90) translate(10, ${left})"`;
    const id = `id="ideo-highlight-${chrId}"`;

    return `<rect class="ideo-highlight" ${id} ${style} ${transform}/>`;
  }).join();

  ideoDom.insertAdjacentHTML('afterBegin', highlightsHtml);
}

function unhighlight(chrNames) {
  const ideo = this;

  let highlightsSelector = `${ideo.selector} .ideo-highlight`;
  if (typeof chrNames !== 'undefined') {
    const taxid = ideo.config.taxid;
    highlightsSelector = chrNames.map(chrName => {
      const chrId = ideo.chromosomes[taxid][chrName].id;
      return `${ideo.selector} #ideo-highlight-${chrId}`;
    });
  }

  document.querySelectorAll(highlightsSelector).forEach((element) => {
    element.remove();
  });

}

export {highlight, unhighlight};
