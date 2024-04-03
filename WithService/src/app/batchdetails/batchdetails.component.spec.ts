import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchdetailsComponent } from './batchdetails.component';

describe('BatchdetailsComponent', () => {
  let component: BatchdetailsComponent;
  let fixture: ComponentFixture<BatchdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchdetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BatchdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
