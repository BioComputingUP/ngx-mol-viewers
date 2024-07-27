import { PageHomeComponent } from './page-home.component';
// import { RouterModule } from '@angular/router';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
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
