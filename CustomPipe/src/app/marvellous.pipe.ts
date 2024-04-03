import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'marvellous',
  standalone: true
})
export class MarvellousPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown 
  {
    let str = value;

    if(args[0] == "Marvellous")
    {
      str += "Educating for better tomorrow" 
    }
    return str;  }

}
