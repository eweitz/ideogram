import VerticalLayout from './vertical-layout';
import HorizontalLayout from './horizontal-layout';
import PairedLayout from './paired-layout';
import SmallLayout from './small-layout';

function getLayout(ideo) {
  var config = ideo.config;

  if ('perspective' in config && config.perspective === 'comparative') {
    return new PairedLayout(config, ideo);
  } else if ('rows' in config && config.rows > 1) {
    return new SmallLayout(config, ideo);
  } else if (config.orientation === 'vertical') {
    return new VerticalLayout(config, ideo);
  } else if (config.orientation === 'horizontal') {
    return new HorizontalLayout(config, ideo);
  } else {
    return new VerticalLayout(config, ideo);
  }
}

export {getLayout}