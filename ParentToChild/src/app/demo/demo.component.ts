import { Component } from '@angular/core';
import { Input } from '@angular/core';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.css'
})

export class DemoComponent {
  @Input() public parentData : any;

}
