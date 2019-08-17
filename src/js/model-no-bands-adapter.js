// import {ModelAdapter} from './model-adapter';

// export class ModelNoBandsAdapter extends ModelAdapter {
//
//   constructor(model) {
//     super(model);
//     this._class = 'ModelNoBandsAdapter';
//   }
//
//   getModel() {
//     this._model.bands = [];
//
//       // If chromosome width more, then 1 add single band to bands array
//     if (this._model.width > 1) {
//       this._model.bands.push({
//         name: 'q',
//         px: {
//           start: 0,
//           stop: this._model.width,
//           width: this._model.width
//         }
//       });
//     }
//
//     return this._model;
//   }
//
//   getCssClass() {
//     return 'noBands';
//   }
//
// }
