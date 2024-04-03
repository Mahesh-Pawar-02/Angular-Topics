import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTaskComponent } from './admin-task.component';

describe('AdminTaskComponent', () => {
  let component: AdminTaskComponent;
  let fixture: ComponentFixture<AdminTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminTaskComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
