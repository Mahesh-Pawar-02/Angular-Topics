import { Component } from '@angular/core';
import { validateHeaderName } from 'http';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.css'
})

export class DemoComponent 
{
    public Name : string = "";

    public MarvellousEvent()
    {
      console.log("Marvellous button clicked");
    }

    public InfosystemsEvent()
    {
      this.Name = "Infosystems button gets clicked";
    }

    public AngularEvent(Value : any)
    {
      console.log(Value);
    }
}
