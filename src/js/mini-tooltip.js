export const miniTooltipStyle = `
.mini-tooltip {
  display:inline-block;
  position:relative;
  // border-bottom:1px dotted #666;
  text-align:left;
}

.mini-tooltip h3 {margin:12px 0;}

.mini-tooltip .mtt-top {
    min-width:200px;
    max-width:400px;
    top:-20px;
    left:50%;
    transform:translate(-30%,-100%);
    padding:10px 20px;
    color:#ffffff;
    background-color:#000;
    font-weight:normal;
    font-size:14px;
    border-radius:8px;
    position:absolute;
    z-index:99999999;
    box-sizing:border-box;
    box-shadow:0 1px 8px rgba(0,0,0,0.5);
    display:none;
}

.mini-tooltip:hover .mtt-top {
    display:block;
}

.mini-tooltip .mtt-top i {
    position:absolute;
    top:100%;
    left:30%;
    margin-left:-15px;
    width:30px;
    height:15px;
    overflow:hidden;
}

.mini-tooltip .mtt-top i::after {
    content:'';
    position:absolute;
    width:15px;
    height:15px;
    left:50%;
    transform:translate(-50%,-50%) rotate(45deg);
    background-color:#000;
}
`;

export function getMiniTooltip(content, tooltip) {
  console.log('ok')
  return (
    `
    <div class="mini-tooltip">
      ${content}
        <div class="mtt-top">
          ${tooltip}
          <i></i>
        </div>
    </div>
    `
  )
}
