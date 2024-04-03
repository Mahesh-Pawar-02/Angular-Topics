import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatchlistComponent } from './batchlist.component';

describe('BatchlistComponent', () => {
  let component: BatchlistComponent;
  let fixture: ComponentFixture<BatchlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BatchlistComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BatchlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
