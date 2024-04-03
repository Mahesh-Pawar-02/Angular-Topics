import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BatchesService } from '../batches.service';

@Component({
  selector: 'app-batchdetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batchdetails.component.html',
  styleUrl: './batchdetails.component.css',
  providers :[ BatchesService ]
})

export class BatchdetailsComponent
{
  // Create empty array to hold the batch details
  public batches : any = [];

  // Add the instance of service in side constructor
  constructor(private _batchservice: BatchesService)
  {
    this.batches = this._batchservice.GetBatchDetails();
  }
}