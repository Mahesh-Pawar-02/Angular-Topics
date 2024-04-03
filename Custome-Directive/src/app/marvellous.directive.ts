import { Directive, ElementRef , Host, HostListener} from '@angular/core';

@Directive({
  selector: '[appMarvellous]',
  standalone: true
})
export class MarvellousDirective 
{
  constructor(private obj : ElementRef) 
  {}

  @HostListener('mouseenter') onmouseenter()
  {
      this.obj.nativeElement.style.background = 'blue';
  }

  @HostListener('mouseleave') onmouseleave()
  {
      this.obj.nativeElement.style.background = 'red';
  }
}
