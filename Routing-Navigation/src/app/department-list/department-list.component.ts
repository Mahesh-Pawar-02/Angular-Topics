import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap} from '@angular/router';

@Component({
  selector: 'app-department-list',
  template: `
    <h3>
      Select Your Departments
    </h3>
    <ul class="items">
      <li *ngFor="let department of departments" [class.selected]="isSelected(department)" (click)="onSelect(department)">
        <span class="badge">{{department.id}}</span> {{department.name}}
      </li>
  </ul>
  `,
  styles: []
})
export class DepartmentListComponent implements OnInit {
  
  public selectedId : any;
  departments = [
    {"id": 1, "name": "Dev"},
    {"id": 2, "name": "Testing"},
    {"id": 3, "name": "Quality Assurance"},
    {"id": 4, "name": "Support"},
    {"id": 5, "name": "Back Office"}
  ]
  constructor(private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let id = parseInt(params.get('id')!);
      this.selectedId = id;
    } );
  }

  onSelect(department : any) 
  {
     this.router.navigate([department.id], { relativeTo: this.route });
  }

  isSelected(department : any) 
  { return department.id === this.selectedId; }
}
