import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BatchesService 
{

  constructor() { }

    // Write method in service class which returns array 
  // of batch details
  GetBatchDetails()
  {
    return [
      {"Name":"PPA", "Fees":19000, "Duration":"4 Months"},
      {"Name":"LB", "Fees":17500, "Duration":"4 Months"},
      {"Name":"WEB", "Fees":21500, "Duration":"3 Months"},
      {"Name":"Python", "Fees":24000, "Duration":"3 Months"},
          ];
  }
}
