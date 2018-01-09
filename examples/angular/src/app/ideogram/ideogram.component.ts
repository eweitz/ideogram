import { Component, OnInit} from '@angular/core';
import Ideogram from 'ideogram';

@Component({
  selector: 'app-ideogram',
  templateUrl: './ideogram.component.html',
  styleUrls: ['./ideogram.component.css']
})
export class IdeogramComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    this.createIdeogram();
  }

  createIdeogram() {
    const ideogram = new Ideogram({
      organism: 'human',
      dataDir: 'https://unpkg.com/ideogram@0.10.0/dist/data/bands/native/',
      container: '#ideo-container'
    });
  }

}
