import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.css'
})

export class DemoComponent 
{
  name = "Marvellous Infosystems";
  today = new Date();
  no = 32.389;

  constructor() { }

  public Institute = 
  {
    "Name" : "Marvellous",
    "Location" : "Pune"
  }
}
