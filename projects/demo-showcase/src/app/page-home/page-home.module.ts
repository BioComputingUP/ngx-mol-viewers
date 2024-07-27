import { PageHomeComponent } from './page-home.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';



@NgModule({
  declarations: [
    PageHomeComponent,
  ],
  imports: [
    RouterModule,
    CommonModule,
  ]
})
export class PageHomeModule { }
