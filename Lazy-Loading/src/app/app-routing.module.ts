import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes :Routes = [
  {path : 'admin', loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule) },
  {path: 'staff', loadChildren: () => import('./staff/staff.module').then(m => m.StaffModule) },
  {
    path: '',
    redirectTo: '',
    pathMatch: 'full'
  } 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }