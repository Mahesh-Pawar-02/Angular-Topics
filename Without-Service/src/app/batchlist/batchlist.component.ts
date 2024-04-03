import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-batchlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './batchlist.component.html',
  styleUrl: './batchlist.component.css'
})
export class BatchlistComponent {
  public batches = 
  [
    {"Name":"PPA", "Fees":19500, "Duration":"4 Months"},
    {"Name":"LB", "Fees":20500, "Duration":"4 Months"},
    {"Name":"WEB", "Fees":21000, "Duration":"3 Months"},
    {"Name":"Python", "Fees":20700, "Duration":"3 Months"},
  ];
}
