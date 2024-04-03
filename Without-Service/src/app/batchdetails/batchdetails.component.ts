import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-batchdetails',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batchdetails.component.html',
  styleUrl: './batchdetails.component.css'
})
export class BatchdetailsComponent {
// Same array is used in both components
public batches = 
[
  {"Name":"PPA", "Fees":19500, "Duration":"4 Months"},
  {"Name":"LB", "Fees":20500, "Duration":"4 Months"},
  {"Name":"WEB", "Fees":21000, "Duration":"3 Months"},
  {"Name":"Python", "Fees":20700, "Duration":"3 Months"},
];
}
