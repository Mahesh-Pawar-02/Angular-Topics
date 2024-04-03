import { Component } from '@angular/core';

@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.css'
})
export class DemoComponent 
{
  // Event listener for button
  public AcceptData(value : any)
  {
    console.log(value);
  }
}
