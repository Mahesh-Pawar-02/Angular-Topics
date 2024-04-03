import { Routes } from '@angular/router';
import { BatchdetailsComponent } from './batchdetails/batchdetails.component';
import { BatchlistComponent } from './batchlist/batchlist.component';

export const routes: Routes = [
    {path: 'batchlist', component: BatchlistComponent},
    {path: 'batchdetails', component: BatchdetailsComponent},
];
