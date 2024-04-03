import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MarvellousPipe } from '../marvellous.pipe';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, MarvellousPipe],
  templateUrl: './demo.component.html',
  styleUrl: './demo.component.css'
})

export class DemoComponent 
{

}
