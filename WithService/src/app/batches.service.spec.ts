import { TestBed } from '@angular/core/testing';

import { BatchesService } from './batches.service';

describe('BatchesService', () => {
  let service: BatchesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
