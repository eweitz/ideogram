import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IdeogramComponent } from './ideogram.component';

describe('IdeogramComponent', () => {
  let component: IdeogramComponent;
  let fixture: ComponentFixture<IdeogramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IdeogramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IdeogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
