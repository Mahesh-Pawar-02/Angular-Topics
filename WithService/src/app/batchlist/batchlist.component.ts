import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchesService } from '../batches.service';

@Component({
  selector: 'app-batchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batchlist.component.html',
  styleUrl: './batchlist.component.css',
  providers :[ BatchesService ]
})

export class BatchlistComponent
{
  // Create empty array to hold the batch details
  public batches : any = [];

  // Add the instance of service in side constructor
  constructor(private _batchservice: BatchesService)
  {
    this.batches = this._batchservice.GetBatchDetails();
  }
}
