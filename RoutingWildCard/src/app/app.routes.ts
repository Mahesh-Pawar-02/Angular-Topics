import { Routes } from '@angular/router';
import { BatchdetailsComponent } from './batchdetails/batchdetails.component';
import { BatchlistComponent } from './batchlist/batchlist.component';
import { InvalidpageComponent } from './invalidpage/invalidpage.component';

export const routes: Routes = [
    {path: 'batchlist', component: BatchlistComponent},
    {path: 'batchdetails', component: BatchdetailsComponent},
      //Add on default path
  { path: '', component:BatchlistComponent},
  // It is our Widcard component
  {path : '**', component:InvalidpageComponent}
];
