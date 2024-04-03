import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
@Component({
  selector: 'app-department-detail',
  template: `
    <h2>Thank for selecting the department</h2>
    <h3>You selected Department with ID = {{departmentId}}</h3>  
    <router-outlet></router-outlet>
    
    <div>
      <button (click)="gotoDepartments()">Back</button>
    </div>
  `,
  styles: []
})
export class DepartmentDetailComponent implements OnInit {

  public departmentId : any;
  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() 
  {
    this.route.paramMap.subscribe((params: ParamMap) => {
      let id = parseInt(params.get('id')!);
      this.departmentId = id;

    });
  }

  gotoDepartments() 
  {
    let selectedId = this.departmentId ? this.departmentId : null;
    this.router.navigate(['../', { id: selectedId }], { relativeTo: this.route });
  }
}
